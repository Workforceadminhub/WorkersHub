import { db } from "../database/db.server";
import { signAccessToken } from "../utils";
import { ROLES, ROLES_VALUES } from "../utils/enums";
import { verifyPassword } from "../utils/passwordHash";

const getRole = (user: {
  id: string;
  code: string | null;
  userinfo: string | null;
  linked_church_worker_id: string | null;
  createdat: Date | null;
  updatedat: Date | null;
  route: string | null;
  department: string | null;
  team: string | null;
  permissions?: unknown;
  role?: string | null;
}) => {
  const trimmedRole = user.role?.trim();
  if (trimmedRole && ROLES_VALUES.includes(trimmedRole)) return trimmedRole;
  if (user.route?.includes("super-admin")) return ROLES.SUPER_ADMIN;
  if (user.route?.includes("admin")) return ROLES.ADMIN;
  if (user.code === "Rhinoceros") return ROLES.ADMIN;
  return ROLES.USER;
};

/** Normalize permissions to string[] from DB (jsonb array or null). */
function getPermissions(user: { permissions?: unknown; department?: string | null }): string[] {
  if (user.permissions != null && Array.isArray(user.permissions)) {
    return user.permissions.filter((p): p is string => typeof p === "string");
  }
  if (user.department) {
    return [user.department];
  }
  return [];
}

const AuthService = () => {
  /**
   * Email + password sign-in. Email is stored normalized (lowercase) on `church_admin_workers.email`.
   * Inactive accounts (e.g. pending self-registration) receive a clear error.
   */
  const login = async ({ email, password }: { email: string; password: string }) => {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password) {
      throw new Error("Invalid email or password.");
    }

    const user = await db
      .selectFrom("church_admin_workers as users")
      .selectAll()
      .where("users.email", "=", emailNorm)
      .executeTakeFirst();

    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isactive) {
      throw new Error("Account is pending approval. Contact an administrator.");
    }

    if (user.email_verified_at == null) {
      throw new Error("Please verify your email before signing in.");
    }

    const permissions = getPermissions(user);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email ?? emailNorm,
      route: user.route,
      department: user.department,
      team: user.team,
      role: getRole(user),
      permissions,
    });

    const role = getRole(user);
    return { accessToken, user: { ...user, permissions, role } };
  };

  return {
    login,
  };
};

export default AuthService;

