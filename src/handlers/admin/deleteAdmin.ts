import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { deleteAdmin } from "../../services/admin.server";
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

    const result = await deleteAdmin(adminId);
    if (!result) {
      return response(404, "Admin not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Admin deleted successfully",
        data: result,
      }),
    };
  } catch (err) {
    console.error("Delete admin error:", err);
    return response(500, "Internal Server Error");
  }
});
