import { withRole } from "../../../middleware";
import AttendanceService from "../../../services/attendance.server";
import { response } from "../../../utils";
import { ROLES_ADMIN_AND_ABOVE } from "../../../utils/enums";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    if (!event.body) {
      return response(400, "Request body is required.");
    }
    const payload = JSON.parse(event.body || "{}");
    const attendancedate = payload.attendancedate;
    if (!attendancedate) {
      return response(400, "Attendance date is required.");
    }

    const service = AttendanceService();
    const data = await service.exportAttendance(attendancedate);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance exported successfully",
        data,
      }),
    };
  } catch (err: any) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
