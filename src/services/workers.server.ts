import * as bcrypt from "bcryptjs";
import { getUniqueId } from "../utils";
import { db } from "../database/db.server";
import axios from "axios";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils";
import { addDays } from "date-fns";
import { getNextSunday } from "../utils/getDate";
import { routeObject } from "../utils/routeObjects";
import { sql } from "kysely";
import { sendEmailThroughBrevo, sendEmailThroughBrevoTemplate } from "../utils/brevo";

type UserType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  nationality?: string;
  state?: string;
  hasAcceptedTerms: boolean;
};

interface ListWorkersInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: {
    department?: string;
    /** When set, filter workers whose department is in this list (overrides single department). */
    departments?: string[];
    team?: string;
    workerrole?: string;
    maritalstatus?: string;
    status?: string;
    agerange?: string;
    gender?: string;
    employment?: string;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface WorkerInput {
  firstname?: string | null;
  lastname?: string | null;
  othername?: string | null;
  email?: string | null;
  phonenumber?: string | null;
  maritalstatus?: string | null;
  department?: string | null;
  team?: string | null;
  workerrole?: string | null;
  birthdate?: string | null;
  agerange?: string | null;
  gender?: string | null;
  address?: string | null;
  occupation?: string | null;
  status?: string | null;
  isactive?: boolean | null;
}

export const WORKER_STATUS = {
  PENDING_ADD: "PENDING_ADD",
  PENDING_DELETE: "PENDING_DELETE",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const WorkersService = () => {
  const fetchWorkers = async (department: string, activeDate?: string) => {
    console.log("Fetch workers called with:", { department, activeDate });
    try {
      const dateForAttendance = activeDate
        ? (decodeURIComponent(activeDate) as string)
        : getNextSunday();
      let workers = [];
      workers = await db
        .selectFrom("worker")
        .leftJoin("attendance", (join) =>
          join
            .onRef("attendance.workerid", "=", "worker.id")
            .on("attendance.attendancedate", "=", dateForAttendance),
        )
        //@ts-ignore
        .select([
          "worker.address",
          "worker.id",
          "worker.department",
          "worker.email",
          "worker.firstname",
          "worker.fullname",
          "worker.lastname",
          "worker.phonenumber",
          "worker.employment",
          "worker.status",
          "worker.team",
          "worker.othername",
          "worker.ispresent",
          "worker.occupation",
          "worker.agerange",
          "worker.address",
          "worker.birthdate",
          "worker.reasonfordelete",
          "worker.createdat",
          "worker.nameofrequester",
          "worker.workerrole",
          "worker.roleofrequester",
          "worker.maritalstatus",
          "worker.fullnamereverse",
          "worker.gender",
          "attendance.workerid as attendance_workerid",
          "attendance.attendance as attendance_value",
          "attendance.attendancedate as attendance_date",
        ])
        .where("worker.department", "=", department)
        .execute();
      if (workers.length === 0) {
        workers = await db
          .selectFrom("worker")
          .leftJoin("attendance", (join) =>
            join
              .onRef("attendance.workerid", "=", "worker.id")
              .on("attendance.attendancedate", "=", dateForAttendance),
          )
          //@ts-ignore
          .select([
            "worker.address",
            "worker.id",
            "worker.department",
            "worker.email",
            "worker.firstname",
            "worker.fullname",
            "worker.lastname",
            "worker.phonenumber",
            "worker.employment",
            "worker.status",
            "worker.team",
            "worker.othername",
            "worker.ispresent",
            "worker.occupation",
            "worker.agerange",
            "worker.address",
            "worker.birthdate",
            "worker.reasonfordelete",
            "worker.createdat",
            "worker.nameofrequester",
            "worker.workerrole",
            "worker.roleofrequester",
            "worker.maritalstatus",
            "worker.fullnamereverse",
            "worker.gender",
            "attendance.workerid as attendance_workerid",
            "attendance.attendance as attendance_value",
            "attendance.attendancedate as attendance_date",
          ])
          .where("worker.department", "ilike", `%${department}`)
          .execute();
      }

      console.log(`Fetched ${workers.length} workers from department ${department}`);

      const finalResult = workers
        .map((item) => ({
          ...item,
          name: item.fullname?.trim(),
          attendance: item.attendance_value,
        }))
        .filter(
          (item) =>
            item.status === WORKER_STATUS.ACTIVE ||
            !item.status ||
            item.status === WORKER_STATUS.PENDING_DELETE,
        );

      return finalResult;
    } catch (error) {
      console.error("Error fetching workers:", (error as Error).message);
      return null;
    }
  };

  const fetchUnmarkedWorkers = async (team: string, activeDate?: string) => {
    try {
      const dateForAttendance = activeDate || getNextSunday();
      console.log({ dateForAttendance, team });

      const workers = await db
        .selectFrom("worker")
        .selectAll()
        .where("team", "=", team)
        .where((eb) =>
          eb.or([
            eb("status", "is", null),
            eb("status", "=", WORKER_STATUS.ACTIVE),
            eb("status", "=", WORKER_STATUS.PENDING_DELETE),
          ]),
        )
        .execute();

      console.log({ workers });

      const markedWorkers = await db
        .selectFrom("attendance")
        .select(["workerid"])
        .where("attendancedate", "=", dateForAttendance)
        .where("team", "=", team)
        .execute();
      console.log({ markedWorkers });

      const markedIds = markedWorkers.map((w) => w.workerid);
      const unmarkedWorkers = workers.filter((w) => !markedIds.includes(w.id));

      return unmarkedWorkers;
    } catch (error) {
      console.error("Error fetching unmarked workers:", (error as Error).message);
      return null;
    }
  };

  const fetchAdminWorkers = async (
    team: string,
    activeGroup: string,
    activeDate?: string,
    permissions?: string[],
  ) => {
    try {
      const dateForAttendance = activeDate
        ? (decodeURIComponent(activeDate) as string)
        : getNextSunday();
      console.log(
        "Admin fetch for team:",
        team,
        "group:",
        activeGroup,
        "on date:",
        dateForAttendance,
      );
      let departments = routeObject
        .filter((item) => item.team === team)
        .map((item) => item.department);

      // When routeObject has no departments for team (e.g. Gbagada Campus) and permissions provided, use permissions
      if (departments.length === 0 && permissions && permissions.length > 0) {
        departments = permissions;
        console.log("Using permissions as departments:", departments.length);
      }

      if (departments.length === 0) {
        console.warn("No departments found for team:", team, "and no permissions provided");
        return [];
      }

      console.log("Relevant departments:", departments.length);

      let query = db
        .selectFrom("worker")
        .leftJoin("attendance", (join) =>
          join
            .onRef("attendance.workerid", "=", "worker.id")
            .on("attendance.attendancedate", "=", dateForAttendance),
        )
        //@ts-ignore
        .select([
          "worker.address",
          "worker.id",
          "worker.department",
          "worker.email",
          "worker.firstname",
          "worker.fullname",
          "worker.lastname",
          "worker.phonenumber",
          "worker.employment",
          "worker.status",
          "worker.team",
          "worker.othername",
          "worker.ispresent",
          "worker.occupation",
          "worker.agerange",
          "worker.address",
          "worker.birthdate",
          "worker.reasonfordelete",
          "worker.createdat",
          "worker.nameofrequester",
          "worker.workerrole",
          "worker.roleofrequester",
          "worker.maritalstatus",
          "worker.fullnamereverse",
          "worker.gender",
          "attendance.workerid as attendance_workerid",
          "attendance.attendance as attendance_value",
        ]);

      if (activeGroup === "All") {
        query = query.where("worker.department", "in", departments);
      } else {
        query = query.where("worker.department", "=", activeGroup);
      }

      const data = await query.execute();

      const finalResult = data
        .map((item) => ({
          ...item,
          name: item.fullname?.trim(),
          attendance: item.attendance_value,
        }))
        .filter(
          (item) =>
            item.status === WORKER_STATUS.ACTIVE ||
            !item.status ||
            item.status === WORKER_STATUS.PENDING_DELETE,
        );

      return finalResult;
    } catch (error) {
      console.error("Error fetching admin workers:", (error as Error).message);
      return null;
    }
  };

  const addNewWorker = async (worker: any) => {
    try {
      const middlename = worker?.othername;
      const fullname = middlename
        ? `${worker.firstname} ${worker.othername} ${worker.lastname}`
        : `${worker.firstname} ${worker.lastname}`;

      const fullnamereverse = middlename
        ? `${worker.lastname} ${worker.othername} ${worker.firstname}`
        : `${worker.lastname} ${worker.firstname}`;

      const result =
        await sql<number>`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM worker`.execute(db);
      console.log("Next worker ID result:", result);
      //@ts-ignore
      const nextId = result.rows[0].next_id;
      console.log("Next worker ID:", nextId);

      const now = new Date();
      const [inserted] = await db
        .insertInto("worker")
        .values({
          ...worker,
          id: nextId,
          fullname,
          fullnamereverse,
          status: WORKER_STATUS.PENDING_ADD,
          createdat: now,
          updatedat: now,
        })
        .returningAll()
        .execute();

      return inserted;
    } catch (error) {
      console.error("Error adding new worker:", (error as Error).message);
      return null;
    }
  };

  const removeWorker = async (workerid: number, deleteData: any) => {
    try {
      // fetch the worker to ensure they exist
      const worker = await db
        .selectFrom("worker")
        .selectAll()
        .where("id", "=", workerid)
        .executeTakeFirst();
      console.log("Worker to be removed:", worker);
      if (!worker) {
        console.warn("Worker not found with ID:", workerid);
        return false;
      }

      const data = await db
        .updateTable("worker")
        .set({
          status: WORKER_STATUS.PENDING_DELETE,
          reasonfordelete: deleteData?.reasonfordelete,
          nameofrequester: deleteData?.nameofrequester,
          roleofrequester: deleteData?.roleofrequester,
        })
        .where("id", "=", workerid)
        .returningAll()
        .execute();
      console.log("Worker marked for deletion:", data);

      return true;
    } catch (error) {
      console.error("Error removing worker:", (error as Error).message);
      return false;
    }
  };

  const listWorkers = async ({
    page = 1,
    limit = 10,
    sortBy = "fullname",
    sortOrder = "asc",
    search,
    filters = {},
  }: ListWorkersInput): Promise<PaginatedResponse<any>> => {
    const isGetAll = limit === -1;

    const sortableColumns: Record<string, string> = {
      name: "worker.fullname",
      createdAt: "worker.createdat",
      department: "worker.department",
      team: "worker.team",
      status: "worker.status",
    };

    const sortColumn = sortableColumns[sortBy] || "worker.fullname";

    let query = db.selectFrom("worker");

    // === 🔍 Search ===
    if (search && search.trim() !== "") {
      const searchTerm = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("worker.firstname", "ilike", searchTerm),
          eb("worker.lastname", "ilike", searchTerm),
          eb("worker.othername", "ilike", searchTerm),
          eb("worker.fullname", "ilike", searchTerm),
          eb("worker.email", "ilike", searchTerm),
          eb("worker.phonenumber", "ilike", searchTerm),
          eb("worker.birthdate", "ilike", searchTerm),
        ]),
      );
    }

    // === 🧩 Filters ===
    if (filters.departments?.length) {
      query = query.where("worker.department", "in", filters.departments);
    } else if (filters.department) {
      query = query.where("worker.department", "=", filters.department);
    }
    if (filters.team) query = query.where("worker.team", "=", filters.team);
    if (filters.workerrole) query = query.where("worker.workerrole", "=", filters.workerrole);
    if (filters.maritalstatus)
      query = query.where("worker.maritalstatus", "=", filters.maritalstatus);
    if (filters.status) query = query.where("worker.status", "=", filters.status);
    if (filters.agerange) query = query.where("worker.agerange", "=", filters.agerange);
    if (filters.gender) query = query.where("worker.gender", "=", filters.gender);
    if (filters.employment) query = query.where("worker.gender", "=", filters.employment);

    // === 📊 Count total ===
    const totalCountQuery = query
      .select(({ fn }) => [fn.count<number>("worker.id").as("count")])
      .executeTakeFirst();

    // === 📄 Data query ===
    let workersQuery = query
      .selectAll("worker")
      // @ts-ignore
      .orderBy(sortColumn, sortOrder);

    if (!isGetAll) {
      const offset = (page - 1) * limit;
      workersQuery = workersQuery.limit(limit).offset(offset);
    }

    const [workers, totalResult] = await Promise.all([workersQuery.execute(), totalCountQuery]);

    const total = Number(totalResult?.count) || 0;
    const totalPages = isGetAll ? 1 : Math.ceil(total / limit);
    const hasNext = !isGetAll && page < totalPages;
    const hasPrev = !isGetAll && page > 1;

    return {
      data: workers,
      pagination: {
        page,
        limit: isGetAll ? workers.length : limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  };

  const createWorker = async (input: WorkerInput) => {
    const middlename = input?.othername;
    const fullname = middlename
      ? `${input.firstname} ${input.othername} ${input.lastname}`
      : `${input.firstname} ${input.lastname}`;

    const fullnamereverse = middlename
      ? `${input.lastname} ${input.othername} ${input.firstname}`
      : `${input.lastname} ${input.firstname}`;

    const result =
      await sql<number>`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM worker`.execute(db);
    console.log("Next worker ID result:", result);
    //@ts-ignore
    const nextId = result.rows[0].next_id;
    const now = new Date();
    const [worker] = await db
      .insertInto("worker")
      .values({
        ...input,
        id: nextId,
        fullname,
        fullnamereverse,
        status: input?.status || WORKER_STATUS.PENDING_ADD,
        isactive: input.isactive ?? true,
        createdat: now,
        updatedat: now,
      })
      .returningAll()
      .execute();

    return worker;
  };

  const updateWorker = async (id: number, updates: Partial<WorkerInput>) => {
    const worker = await db
      .selectFrom("worker")
      .select(["worker.id"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    if (!worker) {
      throw new Error("Worker not found");
    }
    const updatedWorker = await db
      .updateTable("worker")
      .set({
        ...updates,
        updatedat: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .execute();

    return updatedWorker;
  };

  const approveWorker = async (id: number) => {
    const worker = await db
      .selectFrom("worker")
      .select(["worker.id"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    if (!worker) {
      throw new Error("Worker not found");
    }
    const now = new Date();
    const updatedWorker = await db
      .updateTable("worker")
      .set({
        status: WORKER_STATUS.ACTIVE,
        updatedat: now,
        approvedat: now,
      })
      .where("id", "=", id)
      .returningAll()
      .execute();

    return updatedWorker;
  };

  const approveRemoveWorker = async (id: number) => {
    const worker = await db
      .selectFrom("worker")
      .select(["worker.id"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    if (!worker) {
      throw new Error("Worker not found");
    }
    const updatedWorker = await db
      .updateTable("worker")
      .set({
        status: WORKER_STATUS.INACTIVE,
        updatedat: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .execute();

    return updatedWorker;
  };

  const getWorker = async (id: number) => {
    const worker = await db
      .selectFrom("worker")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!worker) {
      return null;
    }

    return worker;
  };

  const deleteWorker = async (id: number) => {
    const worker = await db
      .selectFrom("worker")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    if (!worker) {
      throw new Error("Worker not found");
    }
    await db.transaction().execute(async (trx) => {
      await db.deleteFrom("attendance").where("attendance.workerid", "=", id).execute();
      await db.deleteFrom("worker").where("id", "=", id).execute();
    });

    return { id, message: "Worker and related attendance records deleted successfully" };
  };

  const generateEmailTemplate = (summary: {
    totalWorkers: number;
    totalPendingAddWorkers: number;
    totalPendingRemoveWorkers: number;
    teams: Array<{
      team: string;
      totalWorkers: number;
      pendingAdd: number;
      pendingDelete: number;
    }>;
  }) => {
    const teamRows = summary.teams
      .map(
        (team) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${team.team}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${team.totalWorkers}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #2196F3;">${team.pendingAdd}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #f44336;">${team.pendingDelete}</td>
    </tr>
  `,
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Worker Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4CAF50; padding-bottom: 20px;">
      <h1 style="margin: 0; color: #2c3e50; font-size: 28px;">Weekly Worker Report</h1>
      <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 14px;">Generated on ${new Date().toLocaleDateString(
        "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" },
      )}</p>
    </div>

    <!-- Summary Cards -->
    <div style="display: flex; justify-content: space-around; margin-bottom: 30px; gap: 15px;">
      <div style="flex: 1; background-color: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #1976D2; font-size: 16px;">Total Workers</h3>
        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #0D47A1;">${
          summary.totalWorkers
        }</p>
      </div>
      
      <div style="flex: 1; background-color: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #388E3C; font-size: 16px;">Pending Add</h3>
        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #1B5E20;">${
          summary.totalPendingAddWorkers
        }</p>
      </div>
      
      <div style="flex: 1; background-color: #ffebee; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #D32F2F; font-size: 16px;">Pending Delete</h3>
        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #B71C1C;">${
          summary.totalPendingRemoveWorkers
        }</p>
      </div>
    </div>

    <!-- Team Breakdown Table -->
    <div style="margin-top: 30px;">
      <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 22px;">Team Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #4CAF50; color: white;">
            <th style="padding: 15px; text-align: left; font-weight: 600;">Team</th>
            <th style="padding: 15px; text-align: center; font-weight: 600;">Total Workers</th>
            <th style="padding: 15px; text-align: center; font-weight: 600;">Pending Add</th>
            <th style="padding: 15px; text-align: center; font-weight: 600;">Pending Delete</th>
          </tr>
        </thead>
        <tbody>
          ${teamRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #7f8c8d; font-size: 12px;">
      <p style="margin: 0;">This is an automated report. Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
  };

  const generateReport = async () => {
    const totalWorkers = await db.selectFrom("worker").select(["team", "status"]).execute();
    const teamGroups = totalWorkers.reduce((acc, worker) => {
      if (!acc[worker.team as string]) {
        acc[worker.team as string] = [];
      }
      acc[worker.team as string].push(worker);
      return acc;
    }, {} as Record<string, typeof totalWorkers>);

    // Convert to array with summary for each team
    const teams = Object.entries(teamGroups).map(([teamName, workers]) => ({
      team: teamName,
      totalWorkers: workers.length,
      pendingAdd: workers.filter((w) => w.status === "PENDING_ADD").length,
      pendingDelete: workers.filter((w) => w.status === "PENDING_DELETE").length,
    }));

    const summary = {
      totalWorkers: totalWorkers.length,
      totalPendingAddWorkers: totalWorkers.filter((worker) => worker.status === "PENDING_ADD"),
      totalPendingRemoveWorkers: totalWorkers.filter(
        (worker) => worker.status === "PENDING_DELETE",
      ),
      teams,
    };
    console.log("Generated report summary:", summary);

    //@ts-ignore
    const emailHTML = generateEmailTemplate(summary);
    const emails = ["chidibede@gmail.com"];
    for (const email of emails) {
      await sendEmailThroughBrevo({
        to: email,
        email: "noreply@hiccgbagada.com",
        htmlContent: emailHTML,
        name: email,
        subject: "Workers report summary",
      });
    }

    return summary;
  };

  function flattenTeamsToParams(
    teams: Array<{ team: string; totalWorkers: number; pendingAdd: number; pendingDelete: number }>,
    max = 10,
  ) {
    const params: Record<string, any> = {};

    for (let i = 0; i < max; i++) {
      const t = teams[i];

      params[`team_${i + 1}_name`] = t ? t.team : "";
      params[`team_${i + 1}_total`] = t ? t.totalWorkers : "";
      params[`team_${i + 1}_pendingAdd`] = t ? t.pendingAdd : "";
      params[`team_${i + 1}_pendingDelete`] = t ? t.pendingDelete : "";
    }

    return params;
  }

  const sendWeeklyWorkerReport = async () => {
    const raw = await db.selectFrom("worker").select(["team", "status"]).execute();

    // group by team
    const teamGroups = raw.reduce((acc, w) => {
      const teamName = w.team ?? "Unassigned";
      if (!acc[teamName]) acc[teamName] = [];
      //@ts-ignore
      acc[teamName].push(w);
      return acc;
    }, {} as Record<string, Array<{ team?: string; status?: string }>>);

    // build teams array for template
    const teams = Object.entries(teamGroups).map(([teamName, workers]) => ({
      team: teamName,
      totalWorkers: workers.length,
      pendingAdd: workers.filter((x) => x.status === "PENDING_ADD").length,
      pendingDelete: workers.filter((x) => x.status === "PENDING_DELETE").length,
    }));

    // totals (numbers, not arrays)
    const totalWorkers = raw.length;
    const totalPendingAddWorkers = raw.filter((r) => r.status === "PENDING_ADD").length;
    const totalPendingRemoveWorkers = raw.filter((r) => r.status === "PENDING_DELETE").length;

    // // build params object that matches the template
    // const params = {
    //   generatedAt: new Date().toLocaleDateString("en-US", {
    //     weekday: "long",
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric",
    //   }),
    //   totalWorkers,
    //   totalPendingAddWorkers,
    //   totalPendingRemoveWorkers,
    //   teams, // array of { team, totalWorkers, pendingAdd, pendingDelete }
    // };

    const summaryParams = {
      generatedAt: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalWorkers,
      totalPendingAddWorkers,
      totalPendingRemoveWorkers,
    };

    // flatten teams (max rows: 10)
    // get unique teams and length
    const uniqueTeams = Array.from(new Set(teams.map((t) => t.team)));
    console.log("Unique teams found:", uniqueTeams.length);
    const teamParams = flattenTeamsToParams(teams, uniqueTeams.length);

    // final params for Brevo template
    const params = {
      ...summaryParams,
      ...teamParams,
    };
    console.log("Final email params:", params);
    const emails = [
      "mobaderinwa@gmail.com",
      "iseyi14@gmail.com",
      "omodara.gbenga@gmail.com",
      "rubites007@gmail.com",
      "ayodejieluwande@gmail.com",
      "chidibede@gmail.com",
    ];
    for (const email of emails) {
      await sendEmailThroughBrevoTemplate({
        to: email,
        templateId: 1,
        params,
      });
    }
  };

  return {
    fetchWorkers,
    fetchUnmarkedWorkers,
    fetchAdminWorkers,
    addNewWorker,
    removeWorker,
    listWorkers,
    createWorker,
    getWorker,
    updateWorker,
    deleteWorker,
    approveWorker,
    approveRemoveWorker,
    generateReport,
    sendWeeklyWorkerReport,
  };
};

export default WorkersService;

