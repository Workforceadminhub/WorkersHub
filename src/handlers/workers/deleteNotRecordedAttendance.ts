import { withRole } from "../../middleware";
import { ROLES_ADMIN_AND_ABOVE } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    const service = AttendanceService();
    const result = await service.deleteNotRecordedAttendance();

    if (!result?.success) {
      return response(500, "Failed to delete Not recorded attendance");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Not recorded attendance deleted successfully",
      }),
    };
  } catch (err) {
    console.error(err);
    return response(500, "Internal Server Error");
  }
});
