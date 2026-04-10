import { withAuth } from "../../middleware";
import TrainingService, { resolveWorkerIdFromAdminUser } from "../../services/training.server";
import { response } from "../../utils";
import { ROLES } from "../../utils/enums";
import { canViewTrainingDashboard } from "../../utils/trainingPermissions";
import { adminUserIdFromAuth, pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  try {
    const trainingId = pathParamId(event, "id");
    if (!trainingId) return response(400, "Invalid training id");

    const isWorker = auth.role === ROLES.USER || auth.role === ROLES.WORKER;
    if (isWorker) {
      const adminId = adminUserIdFromAuth(auth.userId);
      const wid = await resolveWorkerIdFromAdminUser(adminId);
      if (wid == null) return response(403, "No worker profile linked");
      const svc = TrainingService();
      const enrolled = await svc.isEnrolled(trainingId, wid);
      if (!enrolled) return response(403, "Not enrolled");
      const rows = await svc.listRecordings(trainingId, true);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Recordings", data: rows }),
      };
    }

    if (!canViewTrainingDashboard(auth)) {
      return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
    }

    const sp = event.queryStringParameters ?? {};
    const libraryOnly = sp.library_only !== "false";

    const svc = TrainingService();
    const rows = await svc.listRecordings(trainingId, libraryOnly);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Recordings", data: rows }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
