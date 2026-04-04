import { withRole } from "../../middleware";
import { ROLES_ADMIN_AND_ABOVE } from "../../utils/enums";
import { listAuditLogs } from "../../services/audit.server";
import { response } from "../../utils";
import { getDepartmentsFromRequest } from "../../utils/permissions";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (req) => {
  try {
    const q = req.queryStringParameters ?? {};
    const page = q.page ? parseInt(q.page, 10) : 1;
    const limit = q.limit ? parseInt(q.limit, 10) : 20;
    const departments = getDepartmentsFromRequest({
      department: q.department ?? null,
      permissions: q.permissions,
    });
    const team = q.team ?? null;
    const attendancedate = q.attendancedate ?? null;
    const fromDate = q.fromDate ?? null;
    const toDate = q.toDate ?? null;
    const eventFilter = q.event ?? null;

    const result = await listAuditLogs(
      {
        department: departments[0] || undefined,
        departments: departments.length > 0 ? departments : undefined,
        team: team || undefined,
        attendancedate: attendancedate || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        event: eventFilter || undefined,
      },
      { page: Number.isNaN(page) ? 1 : page, limit: Number.isNaN(limit) ? 20 : limit }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      }),
    };
  } catch (err) {
    console.error("Fetch audit error:", err);
    return response(500, "Internal Server Error");
  }
});
