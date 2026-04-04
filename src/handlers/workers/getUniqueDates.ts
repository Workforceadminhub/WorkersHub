import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import AttendanceService from "../../services/attendance.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (event, auth) => {
  try {

    const service = AttendanceService();

    const data = await service.fetchHistoryOptions();
    if (!data) {
      return response(404, "Unique dates not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Unique dates fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
