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
    if (!trainingId) return response(400, "Invalid training id");

    void idempotencyKeyFromEvent(event);

    const body = JSON.parse(event.body || "{}");
    if (!body.provider?.trim()) return response(400, "provider required (e.g. daily, chime, custom)");

    const svc = TrainingService();
    const row = await svc.createStreamSession({
      training_id: trainingId,
      provider: body.provider,
      provider_room_id: body.provider_room_id,
      stream_url: body.stream_url,
      screen_share_enabled: body.screen_share_enabled,
      chat_enabled: body.chat_enabled,
      qna_enabled: body.qna_enabled,
      recording_auto: body.recording_auto,
      participant_list_visible: body.participant_list_visible,
    });
    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Stream session created (wire your live provider to these fields)",
        data: row,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
