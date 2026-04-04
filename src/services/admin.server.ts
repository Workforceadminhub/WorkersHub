import { sql } from "kysely";
import { db } from "../database/db.server";

export type CreateAdminInput = {
  code: string;
  email?: string | null;
  department?: string | null;
  team?: string | null;
  route?: string | null;
  isactive?: boolean | null;
  permissions?: string[];
  role?: string | null;
  permission_level?: string[] | null;
  userinfo?: string | null;
  workerid?: number | null;
};

/**
 * Creates a new admin user. Use max(id)+1 for id. Permissions stored as JSONB.
 * Throws if code already exists.
 */
export async function createAdmin(
  input: CreateAdminInput,
  assignedByUserId?: number | string
): Promise<{ id: number; code: string; permissions: string[]; role: string | null; permission_level: string[] }> {
  const existing = await db.selectFrom("admin").select(["id"]).where("code", "=", input.code).executeTakeFirst();
  if (existing) throw new Error("An admin with this code already exists");

  const lastRow = await db
    .selectFrom("admin")
    .select(["id"])
    .orderBy("id", "desc")
    .limit(1)
    .executeTakeFirst();
  const newId = (lastRow?.id ?? 0) + 1;

  const permissions = input.permissions ?? [];
  const permissionsJson = JSON.stringify(permissions);
  const permissionLevel = input.permission_level ?? [];
  const permissionLevelJson = JSON.stringify(permissionLevel);
  const now = new Date();
  const assignedBy =
    assignedByUserId != null
      ? typeof assignedByUserId === "string"
        ? parseInt(assignedByUserId, 10)
        : assignedByUserId
      : null;

  await db
    .insertInto("admin")
    .values({
      id: newId,
      code: input.code,
      email: input.email ?? null,
      userinfo: input.userinfo ?? null,
      workerid: input.workerid ?? null,
      createdat: now,
      updatedat: now,
      route: input.route ?? null,
      department: input.department ?? null,
      team: input.team ?? null,
      isactive: input.isactive !== undefined ? input.isactive : true,
      permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      assigned_by: Number.isNaN(assignedBy as number) ? null : assignedBy,
      assigned_date: assignedBy != null ? now : null,
      role: input.role ?? null,
      permission_level: sql`CAST(${permissionLevelJson} AS JSONB)`,
    })
    .execute();

  return {
    id: newId,
    code: input.code,
    permissions,
    role: input.role ?? null,
    permission_level: permissionLevel,
  };
}

/**
 * Assigns role and/or permission_level (array) to an admin user. Omitted fields are left unchanged.
 */
export async function assignRole(
  adminId: number,
  role?: string | null,
  permissionLevel?: string[] | null
): Promise<{ id: number; role: string | null; permission_level: string[] } | null> {
  const set: Record<string, unknown> = {};
  if (role !== undefined) set.role = role ?? null;
  if (permissionLevel !== undefined) {
    set.permission_level = sql`CAST(${JSON.stringify(permissionLevel ?? [])} AS JSONB)`;
  }
  if (Object.keys(set).length === 0) {
    const existing = await db.selectFrom("admin").select(["id", "role", "permission_level"]).where("id", "=", adminId).executeTakeFirst();
    if (!existing) return null;
    const levels = Array.isArray(existing.permission_level) ? (existing.permission_level as string[]) : [];
    return { id: existing.id, role: existing.role, permission_level: levels };
  }

  const updated = await db
    .updateTable("admin")
    .set(set as any)
    .where("id", "=", adminId)
    .returning(["id", "role", "permission_level"])
    .executeTakeFirst();

  if (!updated) return null;
  const levels = Array.isArray(updated.permission_level) ? (updated.permission_level as string[]) : [];
  return {
    id: updated.id,
    role: updated.role,
    permission_level: levels,
  };
}

/**
 * Assigns permissions (list of department names) to an admin user.
 * Sets assigned_by and assigned_date to record who assigned and when.
 */
export async function assignPermissions(
  adminId: number,
  permissions: string[],
  assignedByUserId: number | string
): Promise<{ id: number; permissions: string[]; assigned_by: number | null; assigned_date: string | null } | null> {
  const assignedBy =
    typeof assignedByUserId === "string" ? parseInt(assignedByUserId, 10) : assignedByUserId;
  const permissionsJson = JSON.stringify(permissions ?? []);
  const now = new Date();

  const updated = await db
    .updateTable("admin")
    .set({
      permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      assigned_by: Number.isNaN(assignedBy) ? null : assignedBy,
      assigned_date: now,
    })
    .where("id", "=", adminId)
    .returning(["id", "permissions", "assigned_by", "assigned_date"])
    .executeTakeFirst();

  if (!updated) return null;

  const perms = Array.isArray(updated.permissions)
    ? (updated.permissions as string[])
    : [];
  return {
    id: updated.id,
    permissions: perms,
    assigned_by: updated.assigned_by,
    assigned_date: updated.assigned_date ? String(updated.assigned_date) : null,
  };
}

/**
 * Allowed fields when updating an admin (profile / contact). Role and permissions use assignRole/assignPermissions.
 */
export type UpdateAdminFields = {
  email?: string | null;
  code?: string | null;
  department?: string | null;
  team?: string | null;
  route?: string | null;
  isactive?: boolean | null;
  userinfo?: string | null;
  workerid?: number | null;
};

/**
 * Updates an admin by id. Only allowed fields are applied; omitted fields are left unchanged.
 * Returns the updated admin row (selected fields) or null if not found.
 */
export async function updateAdmin(
  adminId: number,
  fields: UpdateAdminFields
): Promise<{
  id: number;
  code: string | null;
  email: string | null;
  department: string | null;
  team: string | null;
  route: string | null;
  isactive: boolean | null;
  userinfo: string | null;
  workerid: number | null;
} | null> {
  const allowedKeys: (keyof UpdateAdminFields)[] = [
    "email",
    "code",
    "department",
    "team",
    "route",
    "isactive",
    "userinfo",
    "workerid",
  ];
  const set: Record<string, unknown> = { updatedat: new Date() };
  for (const key of allowedKeys) {
    if (key in fields && fields[key] !== undefined) {
      set[key] = fields[key];
    }
  }
  if (Object.keys(set).length <= 1) {
    const existing = await db
      .selectFrom("admin")
      .select(["id", "code", "email", "department", "team", "route", "isactive", "userinfo", "workerid"])
      .where("id", "=", adminId)
      .executeTakeFirst();
    return existing ?? null;
  }

  const updated = await db
    .updateTable("admin")
    .set(set as any)
    .where("id", "=", adminId)
    .returning(["id", "code", "email", "department", "team", "route", "isactive", "userinfo", "workerid"])
    .executeTakeFirst();

  return updated ?? null;
}

/**
 * Deletes an admin by id. Returns the deleted id if found, null otherwise.
 */
export async function deleteAdmin(adminId: number): Promise<{ id: number } | null> {
  const deleted = await db
    .deleteFrom("admin")
    .where("id", "=", adminId)
    .returning(["id"])
    .executeTakeFirst();
  return deleted ? { id: deleted.id } : null;
}

/** List all admin users for permission/role management. */
export async function listAdmins() {
  return db
    .selectFrom("admin")
    .select([
      "id",
      "code",
      "email",
      "department",
      "team",
      "route",
      "isactive",
      "permissions",
      "assigned_by",
      "assigned_date",
      "role",
      "permission_level",
    ])
    .orderBy("id", "asc")
    .execute();
}
