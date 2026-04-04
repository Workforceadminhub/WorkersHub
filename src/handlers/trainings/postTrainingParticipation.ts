import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canManageTrainingOperations } from "../../utils/trainingPermissions";
import { idempotencyKeyFromEvent } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canManageTrainingOperations(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(trainingId)) return response(400, "Invalid training id");

    const body = JSON.parse(event.body || "{}");
    const workerId = parseInt(String(body.user_id ?? body.worker_id ?? ""), 10);
    const session_date = String(body.date ?? body.session_date ?? "").slice(0, 10);
    const status = body.status === "absent" ? "absent" : "present";

    if (!Number.isFinite(workerId) || !session_date) {
      return response(400, "user_id (or worker_id) and date required");
    }

    void idempotencyKeyFromEvent(event);

    const svc = TrainingService();
    const result = await svc.recordParticipation({
      trainingId,
      workerId,
      session_date,
      status,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: result.updated ? "Participation updated" : "Participation recorded",
        data: result,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
