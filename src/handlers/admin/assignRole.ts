import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { assignRole } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (req, _auth) => {
  try {
    const id = req.pathParameters?.id;
    if (!id) {
      return response(400, "Admin id is required");
    }
    const adminId = id.trim();
    if (!adminId) {
      return response(400, "Invalid admin id");
    }

    const body = JSON.parse(req.body ?? "{}");
    const role = body.role != null ? (typeof body.role === "string" ? body.role.trim() : null) : undefined;
    const permissionLevelRaw = body.permission_level ?? body.permissionLevel;
    const permissionLevelVal =
      permissionLevelRaw != null && Array.isArray(permissionLevelRaw)
        ? permissionLevelRaw.filter((p: unknown) => typeof p === "string" || typeof p === "number").map((p: string | number) => String(p).trim()).filter(Boolean)
        : undefined;

    if (role === undefined && permissionLevelVal === undefined) {
      return response(400, "Provide role and/or permission_level (array) in the request body");
    }

    const result = await assignRole(adminId, role, permissionLevelVal);
    if (!result) {
      return response(404, "Admin not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Role assigned successfully",
        data: result,
      }),
    };
  } catch (err) {
    console.error("Assign role error:", err);
    return response(500, "Internal Server Error");
  }
});
