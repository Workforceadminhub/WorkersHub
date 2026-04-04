import { withAuth } from "../../middleware";
import TrainingService, { resolveWorkerIdFromAdminUser } from "../../services/training.server";
import { response } from "../../utils";
import { ROLES } from "../../utils/enums";
import { canViewTrainingDashboard } from "../../utils/trainingPermissions";
import { adminUserIdFromAuth } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  try {
    const pathId = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(pathId)) return response(400, "Invalid user id");

    const adminId = adminUserIdFromAuth(auth.userId);
    const linked = await resolveWorkerIdFromAdminUser(adminId);

    const isWorkerOnly = auth.role === ROLES.USER || auth.role === ROLES.WORKER;
    if (isWorkerOnly) {
      if (linked !== pathId) {
        return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
      }
    } else if (!canViewTrainingDashboard(auth)) {
      return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
    }

    const svc = TrainingService();
    const data = await svc.getWorkerTrainingMetrics(pathId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Training metrics",
        data: {
          total_trainings_taken: data.total_trainings_taken,
          ongoing: data.ongoing,
          completed: data.completed,
          upcoming: data.upcoming,
          certificates: data.certificates,
        },
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
