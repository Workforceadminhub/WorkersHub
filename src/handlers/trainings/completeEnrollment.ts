import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canManageTrainingOperations } from "../../utils/trainingPermissions";
import { idempotencyKeyFromEvent, pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canManageTrainingOperations(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = pathParamId(event, "id");
    const enrollmentId = pathParamId(event, "enrollmentId");
    if (!trainingId || !enrollmentId) {
      return response(400, "Invalid ids");
    }

    void idempotencyKeyFromEvent(event);

    const svc = TrainingService();
    const result = await svc.completeEnrollment(trainingId, enrollmentId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Enrollment completed",
        data: result,
      }),
    };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("not found")) return response(404, msg);
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
