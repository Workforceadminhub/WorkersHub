import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";
import { canAccessDepartment, getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    console.log({ auth });
    let query = event?.queryStringParameters || {};
    const activeDate = query?.activeDate;
    const departments = getDepartmentsFromRequest({
      department: query?.activeGroup ?? query?.department,
      permissions: query?.permissions,
    });
    const activeGroup = departments[0];
    const isChurchAdmin = query?.isChurchAdmin === "true";

    console.log("Fetching for department:", activeGroup, "on date:", activeDate);
    if (!activeGroup) {
      return response(400, "Department or permissions is required");
    }
    if (!canAccessDepartment(auth, activeGroup)) {
      return response(403, "You do not have access to this department or team");
    }

    if (!activeDate) {
      console.log("No activeDate provided, using next Sunday");
      return response(400, "activeDate is required");
    }

    const service = AttendanceService();

    let data = await service.fetchAdminAttendance(activeGroup, isChurchAdmin, activeDate, auth);
    // When response for department/group is empty, use permissions list if provided
    const isEmpty = data == null || (Array.isArray(data) && data.length === 0);
    if (isEmpty && query?.permissions != null) {
      const fallbackDepts = getDepartmentsFromRequest({
        department: null,
        permissions: query.permissions,
      }).filter((d) => canAccessDepartment(auth, d));
      if (fallbackDepts.length > 0) {
        data = await service.fetchAdminAttendance(
          fallbackDepts[0],
          isChurchAdmin,
          activeDate,
          auth
        );
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
