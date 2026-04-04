import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { listAdmins } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (_req, _auth) => {
  try {
    const admins = await listAdmins();
    const data = admins.map((a) => ({
      id: a.id,
      department: a.department,
      team: a.team,
      route: a.route,
      code: a.code,
      isactive: a.isactive,
      permissions: Array.isArray(a.permissions) ? a.permissions : [],
      assigned_by: a.assigned_by,
      assigned_date: a.assigned_date ? String(a.assigned_date) : null,
      role: a.role,
      permission_level: Array.isArray(a.permission_level) ? a.permission_level : [],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (err) {
    console.error("List admins error:", err);
    return response(500, "Internal Server Error");
  }
});
