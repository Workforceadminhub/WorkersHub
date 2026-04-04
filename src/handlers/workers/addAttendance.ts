import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { logAudit, metadataFromEvent } from "../../services/audit.server";
import { response } from "../../utils";
import { getNextSunday } from "../../utils/getDate";
import { canAccessDepartment } from "../../utils/permissions";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    if (!event.body) {
      return response(400, "Request body is required.");
    }
    const attendance = JSON.parse(event.body || "{}")?.attendance;
    console.log({ auth, attendance });

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return response(400, "Attendance data must be a non-empty array.");
    }

    const updatedList = attendance.map((record) => ({
      ...record,
      attendance: record?.attendance || "Not recorded",
    }));

    const departmentsInPayload = Array.from(new Set(updatedList.map((r) => r.department).filter(Boolean)));
    for (const dept of departmentsInPayload) {
      if (!canAccessDepartment(auth, dept)) {
        return response(403, "You do not have access to mark attendance for this department");
      }
    }

    const service = AttendanceService();
    const data = await service.addAttendance(updatedList);
    if (!data) {
      return response(500, "Failed to add attendance.");
    }

    const departments = Array.from(new Set(updatedList.map((r) => r.department).filter(Boolean)));
    const persons = updatedList.map((r) => ({
      name: r.name ?? null,
      workerId: r.workerid ?? null,
    }));
    const attendancedateFor =
      updatedList[0]?.attendancedate ?? getNextSunday();

    const metadata: Record<string, unknown> = {
      ...metadataFromEvent(event),
      departments: departments.length ? departments : null,
      persons: persons.length ? persons : null,
      attendancedate: attendancedateFor,
    };
    if (auth.department != null) metadata.department = auth.department;
    if (auth.team != null) metadata.team = auth.team;

    logAudit({
      userId: auth.userId,
      userCode: auth.email,
      event: "attendance_marked",
      metadata,
    }).catch(() => {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Attendance added successfully",
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
