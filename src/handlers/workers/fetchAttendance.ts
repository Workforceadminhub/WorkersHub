import { withRole } from "../../middleware";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import { getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    console.log({ auth });
    let query = event?.queryStringParameters || {};
    const activeDate = query?.activeDate;
    const departments = getDepartmentsFromRequest({
      department: null,
      permissions: query?.permissions,
    });

    if (!activeDate) {
      console.log("No activeDate provided, using next Sunday");
      return response(400, "activeDate is required");
    }

    const service = AttendanceService();

    const data = await service.fetchAttendance(
      activeDate,
      auth,
      departments.length > 0 ? departments : undefined,
    );

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
