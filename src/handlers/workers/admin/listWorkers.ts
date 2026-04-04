import { withRole } from "../../../middleware";
import { ROLES_ADMIN_AND_ABOVE } from "../../../utils/enums";
import WorkersService from "../../../services/workers.server";
import { response } from "../../../utils";
import { canAccessDepartment, getDepartmentsFromRequest } from "../../../utils/permissions";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    const query = event.queryStringParameters || {};
    const departments = getDepartmentsFromRequest({
      department: query?.department,
      permissions: query?.permissions,
    });
    const team = query?.team;
    if (departments.length > 0) {
      for (const dept of departments) {
        if (!canAccessDepartment(auth, dept)) {
          return response(403, "You do not have access to this department");
        }
      }
    }
    if (team && !canAccessDepartment(auth, team)) {
      return response(403, "You do not have access to this team");
    }

    const service = WorkersService();

    const data = await service.listWorkers({
      page: query?.page ? parseInt(query.page, 10) : 1,
      limit: query?.limit ? parseInt(query.limit, 10) : 10,
      sortBy: query?.sortBy || "fullname",
      sortOrder: query?.sortOrder === "desc" ? "desc" : "asc",
      search: query?.search || undefined,
      filters: {
        department: departments.length === 1 ? departments[0] : undefined,
        departments: departments.length > 1 ? departments : undefined,
        team: query?.team,
        workerrole: query?.workerrole,
        maritalstatus: query?.maritalstatus,
        status: query?.status,
        agerange: query?.agerange,
        gender: query?.gender,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Workers fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
