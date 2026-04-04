import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import WorkersService from "../../services/workers.server";
import { response } from "../../utils";
import { canAccessDepartment, getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    console.log({ auth });
    let query = event?.queryStringParameters || {};
    const activeDate = query?.activeDate || "";
    const departments = getDepartmentsFromRequest({
      department: query?.department,
      permissions: query?.permissions,
    });
    const isAdmin = query?.isAdmin || false;
    const team = query?.team || null;
    const activeGroup = query?.activeGroup || "All";

    console.log(
      "Fetching for department(s):",
      departments,
      "on date:",
      activeDate,
      activeGroup ? `for group: ${activeGroup}` : "",
      isAdmin ? "as admin" : "as user",
    );

    const service = WorkersService();
    let data;
    if (isAdmin && team) {
      if (!canAccessDepartment(auth, team)) {
        return response(403, "You do not have access to this team");
      }
      // When team is Gbagada Campus (or routeObject has no match), permissions are used as department list
      const allowedDepts =
        departments.length > 0
          ? departments.filter((d) => canAccessDepartment(auth, d))
          : getDepartmentsFromRequest({
              department: null,
              permissions: query?.permissions,
            }).filter((d) => canAccessDepartment(auth, d));
      data = await service.fetchAdminWorkers(
        team,
        activeGroup,
        activeDate,
        allowedDepts.length > 0 ? allowedDepts : undefined,
      );
    } else {
      if (departments.length === 0) {
        return response(400, "Department or permissions is required");
      }
      for (const dept of departments) {
        if (!canAccessDepartment(auth, dept)) {
          return response(403, "You do not have access to this department");
        }
      }
      if (!activeDate) {
        console.log("No activeDate provided, using next Sunday");
        return response(400, "activeDate is required");
      }
      if (departments.length === 1) {
        data = await service.fetchWorkers(departments[0], activeDate);
        // When response from table for department is empty, use permissions list if provided
        const isEmpty = data == null || (Array.isArray(data) && data.length === 0);
        if (isEmpty && query?.permissions != null) {
          const fallbackDepts = getDepartmentsFromRequest({
            department: null,
            permissions: query.permissions,
          }).filter((d) => canAccessDepartment(auth, d));
          if (fallbackDepts.length === 1) {
            data = await service.fetchWorkers(fallbackDepts[0], activeDate);
          } else if (fallbackDepts.length > 1) {
            const results = await Promise.all(
              fallbackDepts.map((d) => service.fetchWorkers(d, activeDate))
            );
            const seen = new Set<number>();
            data = (results.flat().filter(Boolean) as any[]).filter((w: any) => {
              const id = w?.id;
              if (id == null || seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          }
        }
      } else {
        const results = await Promise.all(
          departments.map((d) => service.fetchWorkers(d, activeDate))
        );
        const seen = new Set<number>();
        data = (results.flat().filter(Boolean) as any[]).filter((w) => {
          const id = w?.id;
          if (id == null || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      }
    }
    console.log("Fetched workers count:", data?.length || 0);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Workers fetched successfully",
        data: data || [],
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
