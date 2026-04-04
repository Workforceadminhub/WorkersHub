import { db } from "../database/db.server";
import { signAccessToken } from "../utils";
import { ROLES, ROLES_VALUES } from "../utils/enums";

const getRole = (user: {
  id: number;
  code: string | null;
  userinfo: string | null;
  workerid: number | null;
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
  const login = async ({ password }: { password: string }) => {
    const user = await db
      .selectFrom("admin as users")
      .selectAll()
      .where("users.code", "=", password)
      .executeTakeFirst();
    console.log("User found:", user);

    if (!user) throw new Error("Invalid email or password.");

    const permissions = getPermissions(user);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.code,
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
