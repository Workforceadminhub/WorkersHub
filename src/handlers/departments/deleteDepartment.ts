import { withRole } from "../../middleware";
import { ROLES_ADMIN_AND_ABOVE } from "../../utils/enums";
import DepartmentService from "../../services/department.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return response(400, "Department id is required");
    }

    const departmentId = id.trim();
    if (!departmentId) return response(400, "Department id is required");

    const service = DepartmentService();
    const result = await service.deleteDepartment(departmentId);

    if (!result) {
      return response(500, "Failed to delete department");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Department deleted successfully",
        data: result,
      }),
    };
  } catch (err: any) {
    console.error("Error deleting department:", err);
    if (err.message === "Department not found") {
      return response(404, "Department not found");
    }
    return response(500, "Internal Server Error");
  }
});

