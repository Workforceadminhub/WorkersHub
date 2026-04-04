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
    const { name, team, route, isactive, code } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return response(400, "Department name is required");
    }

    const service = DepartmentService();
    const department = await service.addDepartment({
      name: name.trim(),
      team: team || null,
      route: route || null,
      isactive: isactive !== undefined ? isactive : true,
      code: code || null,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Department added successfully",
        data: department,
      }),
    };
  } catch (err: any) {
    console.error("Error adding department:", err);
    if (err.message === "Department already exists") {
      return response(409, "Department already exists");
    }
    return response(500, "Internal Server Error");
  }
});

