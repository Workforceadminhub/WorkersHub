import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { assignPermissions } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (req, auth) => {
  try {
    const id = req.pathParameters?.id;
    if (!id) {
      return response(400, "Admin id is required");
    }
    const adminId = parseInt(id, 10);
    if (Number.isNaN(adminId)) {
      return response(400, "Invalid admin id");
    }

    const body = JSON.parse(req.body ?? "{}");
    const permissions = body.permissions;
    if (!Array.isArray(permissions)) {
      return response(400, "permissions must be an array of department names");
    }
    const departmentNames = permissions.filter((p: unknown) => typeof p === "string").map((p: string) => p.trim()).filter(Boolean);

    const result = await assignPermissions(adminId, departmentNames, auth.userId);
    if (!result) {
      return response(404, "Admin not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Permissions assigned successfully",
        data: result,
      }),
    };
  } catch (err) {
    console.error("Assign permissions error:", err);
    return response(500, "Internal Server Error");
  }
});
