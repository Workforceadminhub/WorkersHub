import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canManageTrainingOperations } from "../../utils/trainingPermissions";

export const handler = withAuth(async (event, auth) => {
  if (!canManageTrainingOperations(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = parseInt(event.pathParameters?.id ?? "", 10);
    const streamSessionId = parseInt(event.pathParameters?.streamSessionId ?? "", 10);
    if (!Number.isFinite(trainingId) || !Number.isFinite(streamSessionId)) {
      return response(400, "Invalid ids");
    }

    const body = JSON.parse(event.body || "{}");
    const svc = TrainingService();
    const row = await svc.updateStreamSession(streamSessionId, trainingId, {
      stream_url: body.stream_url,
      started_at: body.started_at,
      ended_at: body.ended_at,
      provider_room_id: body.provider_room_id,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Stream session updated", data: row }),
    };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("not found")) return response(404, msg);
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
