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
    const { id, name, team, route, isactive, code } = body;

    if (!id || typeof id !== "number") {
      return response(400, "Department id is required and must be a number");
    }

    if (name && (typeof name !== "string" || name.trim() === "")) {
      return response(400, "Department name must be a non-empty string if provided");
    }

    const service = DepartmentService();
    const department = await service.updateDepartment({
      id,
      name: name ? name.trim() : undefined,
      team: team !== undefined ? team : undefined,
      route: route !== undefined ? route : undefined,
      isactive: isactive !== undefined ? isactive : undefined,
      code: code !== undefined ? code : undefined,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Department updated successfully",
        data: department,
      }),
    };
  } catch (err: any) {
    console.error("Error updating department:", err);
    if (err.message === "Department not found") {
      return response(404, "Department not found");
    }
    if (err.message === "Department name already exists") {
      return response(409, "Department name already exists");
    }
    return response(500, "Internal Server Error");
  }
});

