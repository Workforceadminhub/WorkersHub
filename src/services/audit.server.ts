import { sql } from "kysely";
import { db } from "../database/db.server";
import { getUniqueId } from "../utils";

/** RDS Data API cannot serialize raw objects to JSONB; we must pass a JSON string and CAST in SQL. */
function sanitizeForJson(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string")
    return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = sanitizeForJson(v);
    }
    return out;
  }
  return null;
}

export type AuditFilters = {
  department?: string | null;
  /** When provided, filter by any of these departments (overrides single department if both set). */
  departments?: string[] | null;
  team?: string | null;
  attendancedate?: string | null;
  fromDate?: string | null; // date logged (createdat) range start (ISO date or datetime)
  toDate?: string | null; // date logged range end
  /** Filter by event name. Comma-separated for multiple (e.g. "login,attendance_marked"). */
  event?: string | null;
};

export type AuditPagination = {
  page?: number;
  limit?: number;
};

export type ListAuditResult = {
  data: Array<{
    id: string;
    user_id: string | null;
    user_code: string | null;
    event: string;
    createdat: string | Date | null;
    metadata: unknown;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Payload for the audit log. We log everything that happens so you can track how the app and services are used.
 */
export type AuditPayload = {
  userId?: string | null;
  userCode?: string | null;
  event: string;
  metadata?: Record<string, unknown> | null;
};

/** Request-derived metadata stored in audit_log.metadata for tracking (browser, device, IP, etc.). */
export type RequestMetadata = {
  userAgent?: string | null;
  deviceType?: "mobile" | "tablet" | "desktop" | null;
  browser?: string | null;
  os?: string | null;
  ip?: string | null;
  referer?: string | null;
  method?: string | null;
  path?: string | null;
  [key: string]: unknown;
};

/**
 * Extracts tracking-friendly metadata from API Gateway event (headers + requestContext).
 * Use this and merge with method/path when calling logAudit so we keep full context in one place.
 */
export function metadataFromEvent(event: {
  headers?: Record<string, string | undefined> | null;
  requestContext?: {
    http?: { sourceIp?: string; method?: string };
    identity?: { sourceIp?: string };
  };
  path?: string;
  httpMethod?: string;
}): RequestMetadata {
  const headers = event?.headers ?? {};
  const ua = (headers["user-agent"] ?? headers["User-Agent"] ?? "").trim();
  const meta: RequestMetadata = {};

  if (ua) {
    meta.userAgent = ua;
    meta.deviceType = parseDeviceType(ua);
    meta.browser = parseBrowser(ua);
    meta.os = parseOs(ua);
  }

  const ctx = event?.requestContext;
  const ip =
    ctx?.http?.sourceIp ??
    (ctx as any)?.identity?.sourceIp ??
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
    headers["x-real-ip"];
  if (ip) meta.ip = ip;

  const referer = headers["referer"] ?? headers["Referer"];
  if (referer) meta.referer = referer;

  const method = ctx?.http?.method ?? event?.httpMethod;
  if (method) meta.method = method;
  const path = (event as any)?.rawPath ?? event?.path;
  if (path) meta.path = path;

  return meta;
}

function parseDeviceType(ua: string): "mobile" | "tablet" | "desktop" | null {
  const lower = ua.toLowerCase();
  if (/\b(ipad|tablet|playbook|silk)\b/.test(lower)) return "tablet";
  if (/\b(mobile|android|iphone|ipod|blackberry|opera mini|iemobile|windows phone)\b/.test(lower))
    return "mobile";
  return "desktop";
}

function parseBrowser(ua: string): string | null {
  const edge = ua.match(/(?:Edg|Edge)\/([\d.]+)/i);
  if (edge) return `Edge ${edge[1]}`;
  const chrome = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/i);
  if (chrome) return `Chrome ${chrome[1]}`;
  const firefox = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/i);
  if (firefox) return `Firefox ${firefox[1]}`;
  const safari = ua.match(/Version\/([\d.]+).*Safari/i) && !ua.includes("Chrome");
  if (safari) return "Safari";
  const ie = ua.match(/(?:MSIE\s|Trident\/.*rv:)([\d.]+)/i);
  if (ie) return `IE ${ie[1]}`;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edge")) return "Edge";
  return null;
}

function parseOs(ua: string): string | null {
  const lower = ua.toLowerCase();
  if (lower.includes("windows nt 10")) return "Windows 10/11";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("mac os x") || lower.includes("macintosh")) return "macOS";
  if (lower.includes("iphone") || lower.includes("ipad")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("linux")) return "Linux";
  return null;
}

/**
 * Fetches audit log with optional filters and pagination.
 * Filters: event, department, team, attendancedate, fromDate/toDate (createdat range).
 */
export async function listAuditLogs(
  filters: AuditFilters = {},
  pagination: AuditPagination = {},
): Promise<ListAuditResult> {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
  const offset = (page - 1) * limit;

  let baseQuery = db.selectFrom("audit_log");

  const deptList =
    filters?.departments && filters.departments.length > 0
      ? filters.departments.map((d) => d.trim()).filter(Boolean)
      : filters?.department?.trim()
        ? [filters.department.trim()]
        : [];
  if (deptList.length > 0) {
    baseQuery = baseQuery.where(
      sql<boolean>`(${sql.join(
        deptList.map(
          (dept) =>
            sql`(EXISTS (SELECT 1 FROM jsonb_array_elements_text(metadata->'departments') AS e WHERE LOWER(e) = LOWER(${dept})) OR LOWER(metadata->>'department') = LOWER(${dept}))`,
        ),
        sql` OR `,
      )})`,
    );
  }
  if (filters.team?.trim()) {
    const team = filters.team.trim();
    baseQuery = baseQuery.where(sql<boolean>`LOWER(metadata->>'team') = LOWER(${team})`);
  }
  if (filters.attendancedate?.trim()) {
    const ad = filters.attendancedate.trim();
    baseQuery = baseQuery.where(sql<boolean>`LOWER(metadata->>'attendancedate') = LOWER(${ad})`);
  }
  if (filters.fromDate) {
    baseQuery = baseQuery.where("createdat", ">=", new Date(filters.fromDate));
  }
  if (filters.toDate) {
    const to = new Date(filters.toDate);
    to.setHours(23, 59, 59, 999);
    baseQuery = baseQuery.where("createdat", "<=", to);
  }
  if (filters.event?.trim()) {
    const events = filters.event
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (events.length === 1) {
      baseQuery = baseQuery.where(sql<boolean>`LOWER(event) = LOWER(${events[0]})`);
    } else if (events.length > 1) {
      baseQuery = baseQuery.where(
        sql<boolean>`LOWER(event) IN (${sql.join(
          events.map((e) => sql`LOWER(${e})`),
          sql`, `,
        )})`,
      );
    }
  }

  const [data, countResult] = await Promise.all([
    baseQuery
      .select(["id", "user_id", "user_code", "event", "createdat", "metadata"])
      .orderBy("createdat", "desc")
      .limit(limit)
      .offset(offset)
      .execute(),
    baseQuery.select(db.fn.count("id").as("count")).executeTakeFirst(),
  ]);

  const total = Number(Number((countResult as { count: string | number } | undefined)?.count) || 0);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Writes one row to the audit log. Use this to record everything that happens so you can track how the app and services are used.
 * Does not throw; failures are logged to console only so request handling is not affected.
 */
export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const userId = payload.userId?.trim() ? payload.userId.trim() : null;

    const metadataJson =
      payload.metadata != null ? JSON.stringify(sanitizeForJson(payload.metadata)) : null;

    await db
      .insertInto("audit_log")
      .values({
        id: getUniqueId(),
        user_id: userId,
        user_code: payload.userCode ?? null,
        event: payload.event,
        metadata: metadataJson === null ? null : sql`CAST(${metadataJson} AS JSONB)`,
      })
      .execute();
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * Returns a short event label from the request (path + method) for the audit log.
 * Used so we have a readable "what happened" in the event column; full context (method, path, browser, etc.) lives in metadata.
 */
export function eventFromRoute(method: string, path: string): string {
  const normalizedPath = (path || "").replace(/\/$/, "") || "/";
  const upper = (method || "GET").toUpperCase();

  if (normalizedPath === "/api/hub/auth/signin" && upper === "POST") return "login";
  if (normalizedPath === "/api/hub/auth/register" && upper === "POST") return "user_registered";
  if (normalizedPath === "/api/hub/auth/bootstrap-super-admin" && upper === "POST")
    return "super_admin_bootstrapped";
  if (normalizedPath === "/api/hub/auth/forgot-password" && upper === "POST") return "password_reset_requested";
  if (normalizedPath === "/api/hub/auth/reset-password" && upper === "POST") return "password_reset_completed";
  if (normalizedPath === "/api/hub/auth/verify-email" && (upper === "GET" || upper === "POST"))
    return "email_verified";
  if (normalizedPath === "/api/hub/auth/resend-verification" && upper === "POST")
    return "verification_email_resent";
  if (normalizedPath.startsWith("/api/hub/attendance/add") && upper === "POST")
    return "attendance_marked";
  if (normalizedPath.startsWith("/api/hub/attendance/admin") && upper === "GET")
    return "admin_attendance_fetched";
  if (normalizedPath.startsWith("/api/hub/attendance") && upper === "GET") return "attendance_fetched";
  if (normalizedPath.startsWith("/api/hub/super/admin/workers") && upper === "GET")
    return "workers_listed_admin";
  if (normalizedPath.startsWith("/api/hub/super/admin/workers") && upper === "POST")
    return "worker_created";
  if (normalizedPath.startsWith("/api/hub/super/admin/workers") && upper === "PUT")
    return "worker_updated";
  if (normalizedPath.includes("/approve") && upper === "PUT" && !normalizedPath.includes("remove"))
    return "worker_approved";
  if (normalizedPath.includes("/approve-remove-worker") && upper === "PUT")
    return "worker_remove_approved";
  if (normalizedPath.startsWith("/api/hub/super/admin/") && upper === "DELETE") return "worker_deleted";
  if (normalizedPath.startsWith("/api/hub/super/admin/attendance/export") && upper === "POST")
    return "attendance_exported";
  if (normalizedPath.startsWith("/api/hub/unmarked/workers") && upper === "GET")
    return "unmarked_workers_fetched";
  if (normalizedPath.startsWith("/api/hub/workers") && upper === "GET") return "workers_fetched";
  if (normalizedPath.startsWith("/api/hub/workers/add") && upper === "POST") return "workers_added";
  if (normalizedPath.startsWith("/api/hub/workers/requestDelete") && upper === "PUT")
    return "worker_remove_requested";
  if (normalizedPath.startsWith("/api/hub/uniquedates") && upper === "GET")
    return "unique_dates_fetched";
  if (normalizedPath.startsWith("/api/hub/attendance/close") && upper === "PUT")
    return "attendance_closed";
  if (normalizedPath.startsWith("/api/hub/attendance/enable") && upper === "PUT")
    return "attendance_enabled";
  if (normalizedPath.startsWith("/api/hub/attendance/disable") && upper === "PUT")
    return "attendance_disabled";
  if (normalizedPath.startsWith("/api/hub/workers/generate/report") && upper === "POST")
    return "report_generated";
  if (normalizedPath.startsWith("/api/hub/departments") && upper === "GET") return "departments_listed";
  if (normalizedPath.startsWith("/api/hub/departments") && upper === "POST") return "department_added";
  if (normalizedPath.startsWith("/api/hub/departments/toggle-status") && upper === "PUT")
    return "department_status_toggled";
  if (normalizedPath.startsWith("/api/hub/departments") && upper === "PUT") return "department_updated";
  if (
    normalizedPath.includes("/departments/") &&
    normalizedPath.endsWith("/delete") &&
    upper === "DELETE"
  )
    return "department_deleted";
  if (
    normalizedPath.startsWith("/api/hub/super/admin/") &&
    normalizedPath.endsWith("/workers/details") &&
    upper === "GET"
  )
    return "worker_details_fetched";

  if (normalizedPath.startsWith("/api/hub/trainings") && upper === "POST") return "training_created";
  if (normalizedPath.startsWith("/api/hub/trainings") && upper === "GET") return "trainings_fetched";
  if (normalizedPath.includes("/trainings/") && normalizedPath.includes("/register") && upper === "POST")
    return "training_registered";
  if (normalizedPath.includes("/trainings/") && normalizedPath.includes("/nominate") && upper === "POST")
    return "training_nominated";
  if (normalizedPath.includes("/participation") && upper === "POST") return "training_participation_recorded";
  if (normalizedPath.includes("/enrollments/") && normalizedPath.includes("/complete") && upper === "POST")
    return "training_enrollment_completed";

  return `${normalizedPath}`;
}
