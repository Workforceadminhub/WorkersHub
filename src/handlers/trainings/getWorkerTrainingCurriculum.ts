import { withAuth } from "../../middleware";
import TrainingService, { resolveWorkerIdFromChurchAdminUser } from "../../services/training.server";
import { response } from "../../utils";
import { ROLES } from "../../utils/enums";
import { adminUserIdFromAuth, pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  try {
    const trainingId = pathParamId(event, "id");
    if (!trainingId) return response(400, "Invalid training id");

    const adminId = adminUserIdFromAuth(auth.userId);
    const linkedWorkerId = await resolveWorkerIdFromChurchAdminUser(adminId);
    if (linkedWorkerId == null) {
      return response(403, "No worker profile linked to this account");
    }

    const isWorkerAccount = auth.role === ROLES.USER || auth.role === ROLES.WORKER;
    if (!isWorkerAccount) {
      return { statusCode: 403, body: JSON.stringify({ success: false, message: "Worker view only" }) };
    }

    const svc = TrainingService();
    const enrolled = await svc.isEnrolled(trainingId, linkedWorkerId);
    if (!enrolled) return response(403, "Not enrolled in this training");

    const curriculum = await svc.getCurriculum(trainingId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Curriculum (worker)",
        data: { training_id: trainingId, modules: curriculum },
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
