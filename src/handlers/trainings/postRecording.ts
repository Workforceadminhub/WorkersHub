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

    void idempotencyKeyFromEvent(event);

    const body = JSON.parse(event.body || "{}");
    if (!body.title?.trim() || !body.storage_url?.trim()) {
      return response(400, "title and storage_url required (S3 or CDN URL after provider finishes recording)");
    }

    const svc = TrainingService();
    const row = await svc.addRecording({
      training_id: trainingId,
      stream_session_id: body.stream_session_id ?? null,
      title: body.title,
      storage_url: body.storage_url,
      duration_seconds: body.duration_seconds ?? null,
      downloadable: body.downloadable,
      library_visible: body.library_visible,
    });
    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Recording added to training library",
        data: row,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
