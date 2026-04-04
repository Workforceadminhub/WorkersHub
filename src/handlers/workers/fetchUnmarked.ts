import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import WorkersService from "../../services/workers.server";
import { response } from "../../utils";
import { canAccessDepartment, getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    console.log({ auth });
    let query = event?.queryStringParameters || {};
    const activeDate = query?.activeDate;
    const departments = getDepartmentsFromRequest({
      department: query?.team,
      permissions: query?.permissions,
    });
    const team = departments[0];

    console.log("Fetching for team:", team, "on date:", activeDate);
    if (!team) {
      return response(400, "Team or permissions is required");
    }
    if (!canAccessDepartment(auth, team)) {
      return response(403, "You do not have access to this team");
    }

    if (!activeDate) {
      console.log("No activeDate provided, using next Sunday");
      return response(400, "activeDate is required");
    }

    const service = WorkersService();

    let data = await service.fetchUnmarkedWorkers(team, activeDate);
    // When response for team is empty, use permissions list if provided
    const isEmpty = data == null || (Array.isArray(data) && data.length === 0);
    if (isEmpty && query?.permissions != null) {
      const fallbackDepts = getDepartmentsFromRequest({
        department: null,
        permissions: query.permissions,
      }).filter((d) => canAccessDepartment(auth, d));
      if (fallbackDepts.length > 0) {
        data = await service.fetchUnmarkedWorkers(fallbackDepts[0], activeDate);
      }
    }
    console.log("unmarked workers", data);
    if (!data) {
      return response(404, "Workers not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Workers fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
