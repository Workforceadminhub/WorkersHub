import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import DepartmentService from "../../services/department.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    const service = DepartmentService();
    const departments = await service.listDepartments(auth);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Departments fetched successfully",
        data: departments,
      }),
    };
  } catch (err) {
    console.error("Error listing departments:", err);
    return response(500, "Internal Server Error");
  }
});

