import { sql } from "kysely";
import { db } from "../database/db.server";
import { getUniqueId } from "../utils";

const CATEGORIES = ["leadership", "orientation", "skills"] as const;
const MODES = ["physical", "virtual"] as const;

export type TrainingCategory = (typeof CATEGORIES)[number];
export type TrainingMode = (typeof MODES)[number];

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (s || "training").slice(0, 200);
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toYmd(v: string | Date): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return typeof v === "string" ? v.slice(0, 10) : "";
}

/**
 * RDS Data API + Kysely send string params as text; Postgres `date` columns need an explicit cast.
 */
function sqlDateColumn(ymd: string) {
  const s = (ymd ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid date; use YYYY-MM-DD (got: ${ymd})`);
  }
  return sql`CAST(${s} AS DATE)`;
}

function trainingLifecycle(start: string | Date, end: string | Date): "upcoming" | "ongoing" | "completed" {
  const t = todayDateString();
  const s = toYmd(start);
  const e = toYmd(end);
  if (t < s) return "upcoming";
  if (t > e) return "completed";
  return "ongoing";
}

/**
 * Worker id for self-service training flows. Only returns an id that still exists on `worker`
 * (avoids FK errors when linked_church_worker_id is stale or the worker row was removed).
 */
export async function resolveWorkerIdFromChurchAdminUser(churchAdminWorkerId: string): Promise<string | null> {
  const row = await db
    .selectFrom("church_admin_workers as c")
    .innerJoin("worker as w", "w.id", "c.linked_church_worker_id")
    .select("w.id")
    .where("c.id", "=", churchAdminWorkerId)
    .executeTakeFirst();
  return row?.id ?? null;
}

async function assertWorkerExists(workerId: string): Promise<void> {
  const row = await db.selectFrom("worker").select("id").where("id", "=", workerId).executeTakeFirst();
  if (!row) {
    throw new Error(
      `Worker not found for id "${workerId}". Use a congregation worker id from the directory (not a church admin user id).`,
    );
  }
}

async function workerCompletedTemplateBefore(
  workerId: string,
  templateSlug: string,
): Promise<boolean> {
  const row = await db
    .selectFrom("training_enrollment as e")
    .innerJoin("training as t", "t.id", "e.training_id")
    .select("e.id")
    .where("e.worker_id", "=", workerId)
    .where("t.template_slug", "=", templateSlug)
    .where("e.completed_at", "is not", null)
    .executeTakeFirst();
  return row != null;
}

export type CreateTrainingInput = {
  name: string;
  description?: string | null;
  cohort?: string | null;
  start_date: string;
  end_date: string;
  category: TrainingCategory;
  facilitator?: string | null;
  mode: TrainingMode;
  duration?: string | null;
  capacity?: number | null;
  registration_deadline?: string | null;
  template_slug?: string | null;
};

const TrainingService = () => {
  const createTraining = async (input: CreateTrainingInput, createdByChurchAdminWorkerId: string) => {
    if (!CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid category; expected one of: ${CATEGORIES.join(", ")}`);
    }
    if (!MODES.includes(input.mode)) {
      throw new Error(`Invalid mode; expected one of: ${MODES.join(", ")}`);
    }
    const desc = input.description?.slice(0, 1500) ?? null;
    const templateSlug = (input.template_slug?.trim() || slugify(input.name)).slice(0, 255);
    const now = new Date();
    const id = getUniqueId();
    const row = await db
      .insertInto("training")
      .values({
        id,
        name: input.name.slice(0, 500),
        description: desc,
        cohort: input.cohort?.slice(0, 255) ?? null,
        // Raw CAST for Postgres `date` (RDS Data API); Kysely DB typings use Timestamp.
        start_date: sqlDateColumn(input.start_date) as unknown as Date,
        end_date: sqlDateColumn(input.end_date) as unknown as Date,
        category: input.category,
        facilitator: input.facilitator?.slice(0, 500) ?? null,
        mode: input.mode,
        duration: input.duration?.slice(0, 100) ?? null,
        capacity: input.capacity ?? null,
        registration_deadline: input.registration_deadline ? new Date(input.registration_deadline) : null,
        template_slug: templateSlug,
        created_by_church_admin_worker_id: createdByChurchAdminWorkerId,
        createdat: now,
        updatedat: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const base =
      process.env.TRAINING_REGISTRATION_BASE_URL ||
      process.env.FRONTEND_URL ||
      "https://hub.example.com";
    const registration_link = `${base.replace(/\/$/, "")}/trainings/register/${row.id}`;

    return {
      training_id: row.id,
      registration_link,
    };
  };

  const getDashboardMetrics = async () => {
    const t = todayDateString();
    const all = await db.selectFrom("training").selectAll().execute();

    let ongoing = 0;
    let upcoming = 0;
    let completed = 0;
    for (const tr of all) {
      const life = trainingLifecycle(tr.start_date, tr.end_date);
      if (life === "ongoing") ongoing++;
      else if (life === "upcoming") upcoming++;
      else completed++;
    }

    const enrolleeRow = await db
      .selectFrom("training_enrollment")
      .select(db.fn.count("id").as("c"))
      .executeTakeFirst();
    const certRow = await db
      .selectFrom("training_certificate")
      .select(db.fn.count("id").as("c"))
      .executeTakeFirst();

    return {
      total_trainings: all.length,
      ongoing_trainings: ongoing,
      upcoming_trainings: upcoming,
      completed_trainings: completed,
      total_enrollees: Number((enrolleeRow as { c?: string | number } | undefined)?.c ?? 0),
      total_certificates_issued: Number((certRow as { c?: string | number } | undefined)?.c ?? 0),
      total_primary_enrollees: Number(
        (
          await db
            .selectFrom("training_enrollment")
            .select(db.fn.count("id").as("c"))
            .where("enrollment_type", "=", "primary")
            .executeTakeFirst()
        )?.c ?? 0,
      ),
    };
  };

  type ListParams = {
    page?: number;
    per_page?: number;
    search?: string | null;
    category?: string | null;
    status?: "upcoming" | "ongoing" | "completed" | null;
  };

  const listTrainings = async (params: ListParams) => {
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(100, Math.max(1, params.per_page ?? 20));
    const offset = (page - 1) * perPage;

    let q = db.selectFrom("training").selectAll();

    if (params.search?.trim()) {
      const s = `%${params.search.trim().toLowerCase()}%`;
      q = q.where(sql<boolean>`LOWER(name) LIKE ${s}`);
    }
    if (params.category?.trim()) {
      q = q.where("category", "=", params.category.trim().toLowerCase());
    }

    const rows = await q.orderBy("start_date", "desc").execute();
    const filtered = rows.filter((tr) => {
      const life = trainingLifecycle(tr.start_date, tr.end_date);
      if (params.status && life !== params.status) return false;
      return true;
    });

    const total = filtered.length;
    const slice = filtered.slice(offset, offset + perPage);

    const enrolleeCounts = await db
      .selectFrom("training_enrollment")
      .select(["training_id", db.fn.count("id").as("cnt")])
      .groupBy("training_id")
      .execute();

    const countMap = new Map<string, number>();
    for (const r of enrolleeCounts) {
      countMap.set(r.training_id, Number(r.cnt));
    }

    const data = slice.map((tr) => ({
      id: tr.id,
      name: tr.name,
      start_date: tr.start_date,
      end_date: tr.end_date,
      short_description: (tr.description ?? "").slice(0, 200),
      duration: tr.duration,
      facilitator: tr.facilitator,
      category: tr.category,
      mode: tr.mode,
      cohort: tr.cohort,
      status: trainingLifecycle(tr.start_date, tr.end_date),
      number_of_enrollees: countMap.get(tr.id) ?? 0,
      number_of_primary_enrollees: undefined as number | undefined,
    }));

    for (const item of data) {
      const primaryCount = await db
        .selectFrom("training_enrollment")
        .select(db.fn.count("id").as("c"))
        .where("training_id", "=", item.id)
        .where("enrollment_type", "=", "primary")
        .executeTakeFirst();
      item.number_of_primary_enrollees = Number((primaryCount as { c?: string | number })?.c ?? 0);
    }

    const metrics = await getDashboardMetrics();

    return {
      data,
      page,
      per_page: perPage,
      total,
      metrics,
    };
  };

  const getTrainingById = async (trainingId: string) => {
    const tr = await db.selectFrom("training").selectAll().where("id", "=", trainingId).executeTakeFirst();
    return tr ?? null;
  };

  const getEnrollees = async (trainingId: string, page: number, perPage: number) => {
    const p = Math.max(1, page);
    const pp = Math.min(100, Math.max(1, perPage));
    const offset = (p - 1) * pp;

    const totalRow = await db
      .selectFrom("training_enrollment")
      .select(db.fn.count("id").as("c"))
      .where("training_id", "=", trainingId)
      .executeTakeFirst();
    const total = Number((totalRow as { c?: string | number })?.c ?? 0);

    const enrollments = await db
      .selectFrom("training_enrollment as e")
      .innerJoin("worker as w", "w.id", "e.worker_id")
      .select([
        "e.id as enrollment_id",
        "e.enrollment_type",
        "e.nomination_source",
        "e.enrolled_at",
        "e.completed_at",
        "w.id as worker_id",
        "w.fullname",
        "w.firstname",
        "w.lastname",
        "w.email",
      ])
      .where("e.training_id", "=", trainingId)
      .orderBy("e.enrolled_at", "desc")
      .limit(pp)
      .offset(offset)
      .execute();

    const sessionDates = await db
      .selectFrom("training_participation")
      .select("session_date")
      .where("training_id", "=", trainingId)
      .execute();
    const uniqueSessionDates = new Set(sessionDates.map((s) => String(s.session_date).slice(0, 10)));

    const participation = await db
      .selectFrom("training_participation")
      .selectAll()
      .where("training_id", "=", trainingId)
      .execute();

    const byWorker = new Map<string, { present: number; total: number }>();
    for (const wid of enrollments.map((e) => e.worker_id)) {
      const present = participation.filter(
        (p) => p.worker_id === wid && p.status === "present",
      ).length;
      byWorker.set(wid, { present, total: uniqueSessionDates.size || 0 });
    }

    return {
      data: enrollments.map((e) => {
        const agg = byWorker.get(e.worker_id) ?? { present: 0, total: 0 };
        const attendance_status =
          agg.total === 0
            ? "not_started"
            : agg.present >= agg.total
              ? "complete"
              : `${agg.present}/${agg.total} sessions present`;

        const name =
          e.fullname?.trim() ||
          `${e.firstname ?? ""} ${e.lastname ?? ""}`.trim() ||
          `Worker #${e.worker_id}`;

        return {
          enrollment_id: e.enrollment_id,
          worker_id: e.worker_id,
          name,
          email: e.email,
          enrollment_type: e.enrollment_type,
          nomination_source: e.nomination_source,
          attendance_status,
          enrolled_at: e.enrolled_at,
          completed_at: e.completed_at,
        };
      }),
      page: p,
      per_page: pp,
      total,
    };
  };

  const enrollWorker = async (opts: {
    trainingId: string;
    workerId: string;
    nominationSource: "self" | "staff" | "leader";
    idempotencyKey?: string | null;
  }) => {
    const tr = await getTrainingById(opts.trainingId);
    if (!tr) throw new Error("Training not found");

    await assertWorkerExists(opts.workerId);

    if (opts.idempotencyKey?.trim()) {
      const existing = await db
        .selectFrom("training_enrollment")
        .selectAll()
        .where("idempotency_key", "=", opts.idempotencyKey.trim())
        .executeTakeFirst();
      if (existing) {
        return {
          enrollment: existing,
          enrollment_type: existing.enrollment_type,
          already_enrolled: true,
        };
      }
    }

    const existingSame = await db
      .selectFrom("training_enrollment")
      .selectAll()
      .where("training_id", "=", opts.trainingId)
      .where("worker_id", "=", opts.workerId)
      .executeTakeFirst();
    if (existingSame) {
      return {
        enrollment: existingSame,
        enrollment_type: existingSame.enrollment_type,
        already_enrolled: true,
      };
    }

    if (tr.registration_deadline) {
      const deadline = new Date(tr.registration_deadline as Date);
      if (new Date() > deadline) throw new Error("Registration deadline has passed");
    }

    if (tr.capacity != null) {
      const cnt = await db
        .selectFrom("training_enrollment")
        .select(db.fn.count("id").as("c"))
        .where("training_id", "=", opts.trainingId)
        .executeTakeFirst();
      if (Number((cnt as { c?: string | number })?.c ?? 0) >= tr.capacity) {
        throw new Error("Training is at full capacity");
      }
    }

    const refresher = await workerCompletedTemplateBefore(opts.workerId, tr.template_slug);
    const enrollmentType = refresher ? "refresher" : "primary";

    const row = await db
      .insertInto("training_enrollment")
      .values({
        id: getUniqueId(),
        training_id: opts.trainingId,
        worker_id: opts.workerId,
        enrollment_type: enrollmentType,
        nomination_source: opts.nominationSource,
        idempotency_key: opts.idempotencyKey?.trim() ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      enrollment: row,
      enrollment_type: enrollmentType,
      already_enrolled: false,
    };
  };

  const nominateWorkers = async (opts: {
    trainingId: string;
    workerIds: string[];
    nominationSource: "staff" | "leader";
    idempotencyKey?: string | null;
  }) => {
    const scope = `trainings:${opts.trainingId}:nominate`;
    if (opts.idempotencyKey?.trim()) {
      const cached = await db
        .selectFrom("api_idempotency")
        .selectAll()
        .where("idempotency_key", "=", opts.idempotencyKey.trim())
        .where("route_scope", "=", scope)
        .executeTakeFirst();
      if (cached) {
        return { results: (cached.response_body as unknown) as unknown[], replayed: true as const };
      }
    }

    const results: unknown[] = [];
    for (const workerId of opts.workerIds) {
      try {
        const r = await enrollWorker({
          trainingId: opts.trainingId,
          workerId,
          nominationSource: opts.nominationSource,
          idempotencyKey: null,
        });
        results.push({
          worker_id: workerId,
          success: true,
          enrollment_type: r.enrollment_type,
          already_enrolled: r.already_enrolled,
        });
      } catch (e) {
        results.push({
          worker_id: workerId,
          success: false,
          error: (e as Error).message,
        });
      }
    }

    if (opts.idempotencyKey?.trim()) {
      const bodyJson = JSON.stringify({ results });
      await db
        .insertInto("api_idempotency")
        .values({
          idempotency_key: opts.idempotencyKey.trim(),
          route_scope: scope,
          response_status: 200,
          response_body: sql`CAST(${bodyJson} AS JSONB)`,
        })
        .execute();
    }

    return { results, replayed: false as const };
  };

  const addModule = async (trainingId: string, title: string, sortOrder?: number) => {
    const maxRow = await db
      .selectFrom("training_module")
      .select(db.fn.max("sort_order").as("m"))
      .where("training_id", "=", trainingId)
      .executeTakeFirst();
    const next = sortOrder ?? Number((maxRow as { m?: string | number } | undefined)?.m ?? -1) + 1;
    return db
      .insertInto("training_module")
      .values({
        id: getUniqueId(),
        training_id: trainingId,
        title: title.slice(0, 500),
        sort_order: next,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  const assertModuleBelongsToTraining = async (moduleId: string, trainingId: string) => {
    const row = await db
      .selectFrom("training_module")
      .select("training_id")
      .where("id", "=", moduleId)
      .executeTakeFirst();
    if (!row || row.training_id !== trainingId) throw new Error("Module not found for this training");
  };

  const addLesson = async (moduleId: string, title: string, content: string | null, sortOrder?: number) => {
    const maxRow = await db
      .selectFrom("training_lesson")
      .select(db.fn.max("sort_order").as("m"))
      .where("module_id", "=", moduleId)
      .executeTakeFirst();
    const next = sortOrder ?? Number((maxRow as { m?: string | number } | undefined)?.m ?? -1) + 1;
    return db
      .insertInto("training_lesson")
      .values({
        id: getUniqueId(),
        module_id: moduleId,
        title: title.slice(0, 500),
        content,
        sort_order: next,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  const getCurriculum = async (trainingId: string) => {
    const modules = await db
      .selectFrom("training_module")
      .selectAll()
      .where("training_id", "=", trainingId)
      .orderBy("sort_order", "asc")
      .execute();
    const lessons =
      modules.length === 0
        ? []
        : await db
            .selectFrom("training_lesson")
            .selectAll()
            .where(
              "module_id",
              "in",
              modules.map((m) => m.id),
            )
            .orderBy("sort_order", "asc")
            .execute();

    const byModule = new Map<string, typeof lessons>();
    for (const l of lessons) {
      const list = byModule.get(l.module_id) ?? [];
      list.push(l);
      byModule.set(l.module_id, list);
    }

    return modules.map((m) => ({
      id: m.id,
      title: m.title,
      sort_order: m.sort_order,
      lessons: (byModule.get(m.id) ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        sort_order: l.sort_order,
      })),
    }));
  };

  const recordParticipation = async (opts: {
    trainingId: string;
    workerId: string;
    session_date: string;
    status: "present" | "absent";
  }) => {
    await assertWorkerExists(opts.workerId);
    const sessionYmd = toYmd(opts.session_date);
    if (!sessionYmd) throw new Error("session_date is required");
    const existing = await db
      .selectFrom("training_participation")
      .select("id")
      .where("training_id", "=", opts.trainingId)
      .where("worker_id", "=", opts.workerId)
      .where(sql<boolean>`session_date = CAST(${sessionYmd} AS DATE)`)
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable("training_participation")
        .set({ status: opts.status })
        .where("id", "=", existing.id)
        .execute();
      return { id: existing.id, updated: true };
    }

    const row = await db
      .insertInto("training_participation")
      .values({
        id: getUniqueId(),
        training_id: opts.trainingId,
        worker_id: opts.workerId,
        session_date: sqlDateColumn(sessionYmd) as unknown as Date,
        status: opts.status,
      })
      .returning("id")
      .executeTakeFirstOrThrow();
    return { id: row.id, updated: false };
  };

  const addDepartmentAssignment = async (input: {
    worker_id: string;
    department_id: string;
    training_id: string | null;
    start_date: string;
    required_duration_days: number;
  }) => {
    const dept = await db
      .selectFrom("department")
      .select("id")
      .where("id", "=", input.department_id)
      .executeTakeFirst();
    if (!dept) throw new Error("Department not found");

    await assertWorkerExists(input.worker_id);

    return db
      .insertInto("training_department_assignment")
      .values({
        id: getUniqueId(),
        worker_id: input.worker_id,
        department_id: input.department_id,
        training_id: input.training_id,
        start_date: sqlDateColumn(input.start_date) as unknown as Date,
        required_duration_days: input.required_duration_days,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  const listDepartmentAssignments = async (trainingId: string) => {
    const rows = await db
      .selectFrom("training_department_assignment as a")
      .innerJoin("worker as w", "w.id", "a.worker_id")
      .leftJoin("department as d", "d.id", "a.department_id")
      .select([
        "a.id",
        "a.worker_id",
        "a.department_id",
        "a.training_id",
        "a.start_date",
        "a.required_duration_days",
        "w.fullname",
        "w.firstname",
        "w.lastname",
        "d.name as department_name",
      ])
      .where("a.training_id", "=", trainingId)
      .orderBy("a.createdat", "desc")
      .execute();

    const today = new Date();
    return rows.map((r) => {
      const start = r.start_date instanceof Date ? r.start_date : new Date(String(r.start_date));
      const daysElapsed = Math.max(
        0,
        Math.floor((today.getTime() - start.getTime()) / (86400 * 1000)),
      );
      const progress_ratio =
        r.required_duration_days > 0
          ? Math.min(1, daysElapsed / r.required_duration_days)
          : 0;
      const name =
        r.fullname?.trim() ||
        `${r.firstname ?? ""} ${r.lastname ?? ""}`.trim() ||
        `Worker #${r.worker_id}`;
      return {
        id: r.id,
        user_id: r.worker_id,
        worker_id: r.worker_id,
        name,
        department_id: r.department_id,
        department_name: r.department_name,
        start_date: r.start_date,
        required_duration_days: r.required_duration_days,
        days_elapsed: daysElapsed,
        progress_ratio,
      };
    });
  };

  const getWorkerTrainings = async (workerId: string) => {
    const rows = await db
      .selectFrom("training_enrollment as e")
      .innerJoin("training as t", "t.id", "e.training_id")
      .select([
        "t.id",
        "t.name",
        "t.start_date",
        "t.end_date",
        "t.category",
        "t.mode",
        "e.enrollment_type",
        "e.completed_at",
        "e.enrolled_at",
      ])
      .where("e.worker_id", "=", workerId)
      .orderBy("t.start_date", "desc")
      .execute();

    return rows.map((r) => ({
      training_id: r.id,
      name: r.name,
      start_date: r.start_date,
      end_date: r.end_date,
      category: r.category,
      mode: r.mode,
      enrollment_type: r.enrollment_type,
      status: trainingLifecycle(r.start_date, r.end_date),
      completed_at: r.completed_at,
      enrolled_at: r.enrolled_at,
    }));
  };

  const getWorkerTrainingMetrics = async (workerId: string) => {
    const list = await getWorkerTrainings(workerId);
    let ongoing = 0;
    let upcoming = 0;
    let completed = 0;
    for (const x of list) {
      if (x.completed_at != null || x.status === "completed") {
        completed++;
        continue;
      }
      if (x.status === "ongoing") ongoing++;
      else if (x.status === "upcoming") upcoming++;
    }

    const certCount = await db
      .selectFrom("training_certificate")
      .select(db.fn.count("id").as("c"))
      .where("worker_id", "=", workerId)
      .executeTakeFirst();

    return {
      total_trainings_taken: list.length,
      ongoing,
      upcoming,
      completed,
      certificates: Number((certCount as { c?: string | number })?.c ?? 0),
    };
  };

  const completeEnrollment = async (trainingId: string, enrollmentId: string) => {
    const en = await db
      .selectFrom("training_enrollment")
      .selectAll()
      .where("id", "=", enrollmentId)
      .where("training_id", "=", trainingId)
      .executeTakeFirst();
    if (!en) throw new Error("Enrollment not found");

    const now = new Date();
    await db
      .updateTable("training_enrollment")
      .set({ completed_at: now })
      .where("id", "=", enrollmentId)
      .execute();

    const existingCert = await db
      .selectFrom("training_certificate")
      .selectAll()
      .where("training_id", "=", trainingId)
      .where("worker_id", "=", en.worker_id)
      .executeTakeFirst();

    if (existingCert) {
      return { enrollment_id: enrollmentId, certificate: existingCert, certificate_created: false };
    }

    const certificate_number = `CERT-${getUniqueId()}`;
    const cert = await db
      .insertInto("training_certificate")
      .values({
        id: getUniqueId(),
        training_id: trainingId,
        worker_id: en.worker_id,
        certificate_number,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { enrollment_id: enrollmentId, certificate: cert, certificate_created: true };
  };

  const listCertificatesForTraining = async (trainingId: string) => {
    return db
      .selectFrom("training_certificate as c")
      .innerJoin("worker as w", "w.id", "c.worker_id")
      .select([
        "c.id",
        "c.certificate_number",
        "c.issued_at",
        "c.worker_id",
        "w.fullname",
        "w.firstname",
        "w.lastname",
        "w.email",
      ])
      .where("c.training_id", "=", trainingId)
      .orderBy("c.issued_at", "desc")
      .execute();
  };

  const createStreamSession = async (input: {
    training_id: string;
    provider: string;
    provider_room_id?: string | null;
    stream_url?: string | null;
    screen_share_enabled?: boolean;
    chat_enabled?: boolean;
    qna_enabled?: boolean;
    recording_auto?: boolean;
    participant_list_visible?: boolean;
  }) => {
    return db
      .insertInto("training_stream_session")
      .values({
        id: getUniqueId(),
        training_id: input.training_id,
        provider: input.provider.slice(0, 64),
        provider_room_id: input.provider_room_id ?? null,
        stream_url: input.stream_url ?? null,
        screen_share_enabled: input.screen_share_enabled ?? true,
        chat_enabled: input.chat_enabled ?? true,
        qna_enabled: input.qna_enabled ?? true,
        recording_auto: input.recording_auto ?? true,
        participant_list_visible: input.participant_list_visible ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  const updateStreamSession = async (
    streamSessionId: string,
    trainingId: string,
    patch: Partial<{
      stream_url: string | null;
      started_at: string | null;
      ended_at: string | null;
      provider_room_id: string | null;
    }>,
  ) => {
    const row = await db
      .selectFrom("training_stream_session")
      .select("id")
      .where("id", "=", streamSessionId)
      .where("training_id", "=", trainingId)
      .executeTakeFirst();
    if (!row) throw new Error("Stream session not found");

    const set: Record<string, unknown> = {};
    if (patch.stream_url !== undefined) set.stream_url = patch.stream_url;
    if (patch.provider_room_id !== undefined) set.provider_room_id = patch.provider_room_id;
    if (patch.started_at !== undefined)
      set.started_at = patch.started_at ? new Date(patch.started_at) : null;
    if (patch.ended_at !== undefined) set.ended_at = patch.ended_at ? new Date(patch.ended_at) : null;

    await db.updateTable("training_stream_session").set(set as any).where("id", "=", streamSessionId).execute();
    return db
      .selectFrom("training_stream_session")
      .selectAll()
      .where("id", "=", streamSessionId)
      .executeTakeFirstOrThrow();
  };

  const addRecording = async (input: {
    training_id: string;
    stream_session_id?: string | null;
    title: string;
    storage_url: string;
    duration_seconds?: number | null;
    downloadable?: boolean;
    library_visible?: boolean;
  }) => {
    return db
      .insertInto("training_recording")
      .values({
        id: getUniqueId(),
        training_id: input.training_id,
        stream_session_id: input.stream_session_id ?? null,
        title: input.title.slice(0, 500),
        storage_url: input.storage_url,
        duration_seconds: input.duration_seconds ?? null,
        downloadable: input.downloadable ?? true,
        library_visible: input.library_visible ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };

  const listRecordings = async (trainingId: string, libraryOnly: boolean) => {
    let q = db.selectFrom("training_recording").selectAll().where("training_id", "=", trainingId);
    if (libraryOnly) q = q.where("library_visible", "=", true);
    return q.orderBy("createdat", "desc").execute();
  };

  const isEnrolled = async (trainingId: string, workerId: string) => {
    const row = await db
      .selectFrom("training_enrollment")
      .select("id")
      .where("training_id", "=", trainingId)
      .where("worker_id", "=", workerId)
      .executeTakeFirst();
    return row != null;
  };

  const getAdminTrainingDetail = async (trainingId: string) => {
    const tr = await getTrainingById(trainingId);
    if (!tr) return null;
    const curriculum = await getCurriculum(trainingId);
    const enrollees = await getEnrollees(trainingId, 1, 500);
    const participation = await db
      .selectFrom("training_participation")
      .selectAll()
      .where("training_id", "=", trainingId)
      .execute();
    const nominations = await db
      .selectFrom("training_enrollment")
      .selectAll()
      .where("training_id", "=", trainingId)
      .where("nomination_source", "in", ["staff", "leader"])
      .execute();
    const assignments = await listDepartmentAssignments(trainingId);
    const stream_sessions = await db
      .selectFrom("training_stream_session")
      .selectAll()
      .where("training_id", "=", trainingId)
      .orderBy("createdat", "desc")
      .execute();
    const recordings = await listRecordings(trainingId, false);

    return {
      training: tr,
      curriculum,
      enrollees: enrollees.data,
      participation,
      nominations,
      department_assignments: assignments,
      stream_sessions,
      recordings,
    };
  };

  return {
    createTraining,
    listTrainings,
    getDashboardMetrics,
    getTrainingById,
    getEnrollees,
    enrollWorker,
    nominateWorkers,
    addModule,
    assertModuleBelongsToTraining,
    addLesson,
    getCurriculum,
    recordParticipation,
    addDepartmentAssignment,
    listDepartmentAssignments,
    getWorkerTrainings,
    getWorkerTrainingMetrics,
    completeEnrollment,
    listCertificatesForTraining,
    createStreamSession,
    updateStreamSession,
    addRecording,
    listRecordings,
    isEnrolled,
    getAdminTrainingDetail,
  };
};

export default TrainingService;
