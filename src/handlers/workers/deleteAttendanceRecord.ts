import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";
import { getNextSunday } from "../../utils/getDate";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    const body = event?.body ? JSON.parse(event.body || "{}") : {};

    const workeridRaw = body?.workerid ?? body?.workerId ?? body?.workerID;
    const attendancedateRaw = body?.attendancedate ?? body?.attendanceDate;

    if (workeridRaw == null) {
      return response(400, "workerid is required");
    }

    const workerid = typeof workeridRaw === "number" ? workeridRaw : parseInt(workeridRaw, 10);
    if (Number.isNaN(workerid)) {
      return response(400, "workerid must be a number");
    }

    const attendancedate =
      typeof attendancedateRaw === "string" && attendancedateRaw.trim().length > 0
        ? (() => {
            // Some clients URL-encode date strings (e.g. spaces -> %20)
            try {
              return decodeURIComponent(attendancedateRaw.trim());
            } catch {
              return attendancedateRaw.trim();
            }
          })()
        : getNextSunday();

    const service = AttendanceService();
    const result = await service.deleteAttendanceRecord(workerid, attendancedate);

    if (!result?.success && result?.notFound) {
      return response(404, "Attendance record not found");
    }

    if (!result?.success) {
      return response(500, "Failed to delete attendance record");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance record deleted successfully",
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});

