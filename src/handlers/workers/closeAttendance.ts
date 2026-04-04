import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    const service = AttendanceService();

    const data = await service.switchOffAttendance();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance switched off successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
