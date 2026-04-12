import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { db } from "../database/db.server";
import { getUniqueId } from "../utils";
import { ROLES } from "../utils/enums";
import { hashPassword } from "../utils/passwordHash";
import { sendPasswordResetEmail, sendVerificationEmail } from "./authEmail.server";

export type CreateAdminInput = {
  code: string;
  email?: string | null;
  /** Plain text; stored as bcrypt in password_hash. Required when isactive is true (default). */
  initialPassword?: string | null;
  department?: string | null;
  team?: string | null;
  route?: string | null;
  isactive?: boolean | null;
  permissions?: string[];
  role?: string | null;
  permission_level?: string[] | null;
  userinfo?: string | null;
  linked_church_worker_id?: string | null;
};

export type RegisterPublicUserInput = {
  email: string;
  password: string;
  firstname?: string | null;
  lastname?: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  if (email == null || typeof email !== "string") return null;
  const t = email.trim().toLowerCase();
  return t.length ? t : null;
}

function assertPasswordPolicy(plain: string): void {
  if (typeof plain !== "string" || plain.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
}

function randomOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}

/**
 * Self-service registration: creates an inactive admin row (role worker) until a super admin activates it.
 */
export async function registerPublicUser(
  input: RegisterPublicUserInput,
): Promise<{ id: string; email: string }> {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("A valid email is required");
  assertPasswordPolicy(input.password);

  const dup = await db.selectFrom("church_admin_workers").select("id").where("email", "=", email).executeTakeFirst();
  if (dup) throw new Error("An account with this email already exists");

  const newId = getUniqueId();
  const code = getUniqueId();
  const now = new Date();
  const verifyToken = randomOpaqueToken();
  const verifyExpires = hoursFromNow(48);
  const userinfo =
    input.firstname?.trim() || input.lastname?.trim()
      ? JSON.stringify({
          firstname: input.firstname?.trim() || null,
          lastname: input.lastname?.trim() || null,
        })
      : null;

  await db
    .insertInto("church_admin_workers")
    .values({
      id: newId,
      code,
      email,
      password_hash: hashPassword(input.password),
      userinfo,
      linked_church_worker_id: null,
      createdat: now,
      updatedat: now,
      route: null,
      department: null,
      team: null,
      isactive: false,
      permissions: sql`CAST('[]' AS JSONB)`,
      assigned_by: null,
      assigned_date: null,
      role: ROLES.WORKER,
      permission_level: sql`CAST('[]' AS JSONB)`,
      email_verified_at: null,
      email_verification_token: verifyToken,
      email_verification_expires: verifyExpires,
      reset_password_token: null,
      reset_password_expires: null,
    })
    .execute();

  try {
    await sendVerificationEmail(email, verifyToken);
  } catch (e) {
    console.error("[auth] Failed to send verification email:", e);
    throw new Error("Account created but verification email could not be sent. Contact support.");
  }

  return { id: newId, email };
}

/**
 * Creates a new admin user. Id is a server-generated ULID. Permissions stored as JSONB.
 * Throws if code already exists.
 */
export async function createAdmin(
  input: CreateAdminInput,
  assignedByUserId?: string | null
): Promise<{ id: string; code: string; permissions: string[]; role: string | null; permission_level: string[] }> {
  const existing = await db.selectFrom("church_admin_workers").select(["id"]).where("code", "=", input.code).executeTakeFirst();
  if (existing) throw new Error("An admin with this code already exists");

  const emailNorm = normalizeEmail(input.email ?? null);
  if (emailNorm) {
    const dupEmail = await db.selectFrom("church_admin_workers").select("id").where("email", "=", emailNorm).executeTakeFirst();
    if (dupEmail) throw new Error("An admin with this email already exists");
  }

  const isactive = input.isactive !== undefined ? input.isactive : true;
  if (isactive) {
    if (!emailNorm) throw new Error("Email is required for active accounts");
    assertPasswordPolicy(input.initialPassword?.trim() ?? "");
  }

  const newId = getUniqueId();

  const permissions = input.permissions ?? [];
  const permissionsJson = JSON.stringify(permissions);
  const permissionLevel = input.permission_level ?? [];
  const permissionLevelJson = JSON.stringify(permissionLevel);
  const now = new Date();
  const assignedBy = assignedByUserId?.trim() ? assignedByUserId.trim() : null;

  const passwordPlain = input.initialPassword?.trim();
  const password_hash = passwordPlain ? hashPassword(passwordPlain) : null;
  const emailVerifiedAt = isactive ? now : null;

  await db
    .insertInto("church_admin_workers")
    .values({
      id: newId,
      code: input.code,
      email: emailNorm,
      password_hash,
      userinfo: input.userinfo ?? null,
      linked_church_worker_id: input.linked_church_worker_id?.trim()
        ? input.linked_church_worker_id.trim()
        : null,
      createdat: now,
      updatedat: now,
      route: input.route ?? null,
      department: input.department ?? null,
      team: input.team ?? null,
      isactive,
      permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      assigned_by: assignedBy,
      assigned_date: assignedBy != null ? now : null,
      role: input.role ?? null,
      permission_level: sql`CAST(${permissionLevelJson} AS JSONB)`,
      email_verified_at: emailVerifiedAt,
      email_verification_token: null,
      email_verification_expires: null,
      reset_password_token: null,
      reset_password_expires: null,
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
  adminId: string,
  role?: string | null,
  permissionLevel?: string[] | null
): Promise<{ id: string; role: string | null; permission_level: string[] } | null> {
  const set: Record<string, unknown> = {};
  if (role !== undefined) set.role = role ?? null;
  if (permissionLevel !== undefined) {
    set.permission_level = sql`CAST(${JSON.stringify(permissionLevel ?? [])} AS JSONB)`;
  }
  if (Object.keys(set).length === 0) {
    const existing = await db.selectFrom("church_admin_workers").select(["id", "role", "permission_level"]).where("id", "=", adminId).executeTakeFirst();
    if (!existing) return null;
    const levels = Array.isArray(existing.permission_level) ? (existing.permission_level as string[]) : [];
    return { id: existing.id, role: existing.role, permission_level: levels };
  }

  const updated = await db
    .updateTable("church_admin_workers")
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
  adminId: string,
  permissions: string[],
  assignedByUserId: string
): Promise<{ id: string; permissions: string[]; assigned_by: string | null; assigned_date: string | null } | null> {
  const assignedBy = assignedByUserId.trim() || null;
  const permissionsJson = JSON.stringify(permissions ?? []);
  const now = new Date();

  const updated = await db
    .updateTable("church_admin_workers")
    .set({
      permissions: sql`CAST(${permissionsJson} AS JSONB)`,
      assigned_by: assignedBy,
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
  linked_church_worker_id?: string | null;
};

/**
 * Updates an admin by id. Only allowed fields are applied; omitted fields are left unchanged.
 * Returns the updated admin row (selected fields) or null if not found.
 */
export async function updateAdmin(
  adminId: string,
  fields: UpdateAdminFields
): Promise<{
  id: string;
  code: string | null;
  email: string | null;
  department: string | null;
  team: string | null;
  route: string | null;
  isactive: boolean | null;
  userinfo: string | null;
  linked_church_worker_id: string | null;
} | null> {
  const allowedKeys: (keyof UpdateAdminFields)[] = [
    "email",
    "code",
    "department",
    "team",
    "route",
    "isactive",
    "userinfo",
    "linked_church_worker_id",
  ];
  const set: Record<string, unknown> = { updatedat: new Date() };
  for (const key of allowedKeys) {
    if (key in fields && fields[key] !== undefined) {
      if (key === "email") {
        set[key] = normalizeEmail(fields.email as string | null | undefined);
      } else {
        set[key] = fields[key];
      }
    }
  }
  if (Object.keys(set).length <= 1) {
    const existing = await db
      .selectFrom("church_admin_workers")
      .select([
        "id",
        "code",
        "email",
        "department",
        "team",
        "route",
        "isactive",
        "userinfo",
        "linked_church_worker_id",
      ])
      .where("id", "=", adminId)
      .executeTakeFirst();
    return existing ?? null;
  }

  const updated = await db
    .updateTable("church_admin_workers")
    .set(set as any)
    .where("id", "=", adminId)
    .returning([
      "id",
      "code",
      "email",
      "department",
      "team",
      "route",
      "isactive",
      "userinfo",
      "linked_church_worker_id",
    ])
    .executeTakeFirst();

  return updated ?? null;
}

/**
 * One-time bootstrap: creates the first Super Admin when none exists.
 * Optional env `AUTH_BOOTSTRAP_SECRET`: when set, request must send the same value in `X-Bootstrap-Secret`.
 */
export async function bootstrapSuperAdmin(input: {
  email: string;
  password: string;
  code?: string | null;
  bootstrapSecret?: string | null;
}): Promise<{ id: string; email: string }> {
  const requiredSecret = process.env.AUTH_BOOTSTRAP_SECRET?.trim();
  if (requiredSecret && input.bootstrapSecret?.trim() !== requiredSecret) {
    throw new Error("Invalid bootstrap secret");
  }

  const countRow = await db
    .selectFrom("church_admin_workers")
    .select((eb) => eb.fn.count("id").as("c"))
    .where("role", "=", ROLES.SUPER_ADMIN)
    .executeTakeFirst();
  const superCount = Number((countRow as { c?: string | number } | undefined)?.c ?? 0);
  if (superCount > 0) {
    throw new Error("A super admin already exists. Bootstrap is disabled.");
  }

  const emailNorm = normalizeEmail(input.email);
  if (!emailNorm) throw new Error("A valid email is required");
  assertPasswordPolicy(input.password);

  const dup = await db.selectFrom("church_admin_workers").select("id").where("email", "=", emailNorm).executeTakeFirst();
  if (dup) throw new Error("An account with this email already exists");

  const code = input.code?.trim() || getUniqueId();
  const dupCode = await db.selectFrom("church_admin_workers").select("id").where("code", "=", code).executeTakeFirst();
  if (dupCode) throw new Error("This code is already in use");

  const now = new Date();
  const newId = getUniqueId();

  await db
    .insertInto("church_admin_workers")
    .values({
      id: newId,
      code,
      email: emailNorm,
      password_hash: hashPassword(input.password),
      userinfo: null,
      linked_church_worker_id: null,
      createdat: now,
      updatedat: now,
      route: "/super-admin",
      department: null,
      team: null,
      isactive: true,
      permissions: sql`CAST('[]' AS JSONB)`,
      assigned_by: null,
      assigned_date: null,
      role: ROLES.SUPER_ADMIN,
      permission_level: sql`CAST('[]' AS JSONB)`,
      email_verified_at: now,
      email_verification_token: null,
      email_verification_expires: null,
      reset_password_token: null,
      reset_password_expires: null,
    })
    .execute();

  return { id: newId, email: emailNorm };
}

/** Always resolves; does not reveal whether the email exists. */
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  if (!email) return;

  const user = await db.selectFrom("church_admin_workers").select(["id", "email"]).where("email", "=", email).executeTakeFirst();
  if (!user?.email) return;

  const token = randomOpaqueToken();
  const expires = hoursFromNow(1);
  await db
    .updateTable("church_admin_workers")
    .set({
      reset_password_token: token,
      reset_password_expires: expires,
      updatedat: new Date(),
    })
    .where("id", "=", user.id)
    .execute();

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (e) {
    console.error("[auth] Password reset email failed:", e);
  }
}

export async function resetPasswordWithToken(tokenRaw: string, newPassword: string): Promise<void> {
  const token = tokenRaw?.trim();
  if (!token) throw new Error("Token is required");
  assertPasswordPolicy(newPassword);

  const now = new Date();
  const user = await db
    .selectFrom("church_admin_workers")
    .select(["id"])
    .where("reset_password_token", "=", token)
    .where("reset_password_expires", ">", now)
    .executeTakeFirst();

  if (!user) throw new Error("Invalid or expired reset token");

  await db
    .updateTable("church_admin_workers")
    .set({
      password_hash: hashPassword(newPassword),
      reset_password_token: null,
      reset_password_expires: null,
      updatedat: now,
    })
    .where("id", "=", user.id)
    .execute();
}

export async function verifyEmailWithToken(tokenRaw: string): Promise<void> {
  const token = tokenRaw?.trim();
  if (!token) throw new Error("Token is required");

  const now = new Date();
  const user = await db
    .selectFrom("church_admin_workers")
    .select(["id"])
    .where("email_verification_token", "=", token)
    .where("email_verification_expires", ">", now)
    .executeTakeFirst();

  if (!user) throw new Error("Invalid or expired verification token");

  await db
    .updateTable("church_admin_workers")
    .set({
      email_verified_at: now,
      email_verification_token: null,
      email_verification_expires: null,
      updatedat: now,
    })
    .where("id", "=", user.id)
    .execute();
}

/** Resend verification email if the account exists and is still unverified. */
export async function resendEmailVerification(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  if (!email) return;

  const user = await db
    .selectFrom("church_admin_workers")
    .select(["id", "email", "email_verified_at"])
    .where("email", "=", email)
    .executeTakeFirst();
  if (!user?.email || user.email_verified_at != null) return;

  const token = randomOpaqueToken();
  const expires = hoursFromNow(48);
  await db
    .updateTable("church_admin_workers")
    .set({
      email_verification_token: token,
      email_verification_expires: expires,
      updatedat: new Date(),
    })
    .where("id", "=", user.id)
    .execute();

  try {
    await sendVerificationEmail(user.email, token);
  } catch (e) {
    console.error("[auth] Resend verification email failed:", e);
  }
}

/**
 * Deletes an admin by id. Returns the deleted id if found, null otherwise.
 */
export async function deleteAdmin(adminId: string): Promise<{ id: string } | null> {
  const deleted = await db
    .deleteFrom("church_admin_workers")
    .where("id", "=", adminId)
    .returning(["id"])
    .executeTakeFirst();
  return deleted ? { id: deleted.id } : null;
}

/** List all admin users for permission/role management. */
export async function listAdmins() {
  return db
    .selectFrom("church_admin_workers")
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
