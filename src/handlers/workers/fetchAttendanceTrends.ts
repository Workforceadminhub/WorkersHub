import { withRole } from "../../middleware";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import { getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    console.log({ auth });
    let query = event?.queryStringParameters || {};
    const departments = getDepartmentsFromRequest({
      department: null,
      permissions: query?.permissions,
    });

    if (departments.length === 0) {
      return response(400, "Permissions (departments) is required");
    }

    const startDate = query?.startDate ?? undefined;
    const endDate = query?.endDate ?? undefined;
    const limit = query?.limit != null ? Math.max(1, parseInt(String(query.limit), 10) || 5) : 5;

    const service = AttendanceService();

    const data = await service.fetchAttendanceTrends(
      departments.length > 0 ? departments : undefined,
      startDate,
      endDate,
      limit,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance trends fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
