import { withRole } from "../../middleware";
import { ROLES_ADMIN_AND_ABOVE } from "../../utils/enums";
import DepartmentService from "../../services/department.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    if (!event.body) {
      return response(400, "Request body is required");
    }

    const body = JSON.parse(event.body);
    const { id, isactive } = body;

    if (!id || typeof id !== "number") {
      return response(400, "Department id is required and must be a number");
    }

    if (typeof isactive !== "boolean") {
      return response(400, "isactive must be a boolean value");
    }

    const service = DepartmentService();
    const department = await service.toggleDepartmentStatus(id, isactive);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Department ${isactive ? "enabled" : "disabled"} successfully`,
        data: department,
      }),
    };
  } catch (err) {
    console.error("Error toggling department status:", err);
    return response(500, "Internal Server Error");
  }
});

