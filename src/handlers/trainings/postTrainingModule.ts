import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canCreateTrainingAndCurriculum } from "../../utils/trainingPermissions";

export const handler = withAuth(async (event, auth) => {
  if (!canCreateTrainingAndCurriculum(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(trainingId)) return response(400, "Invalid training id");
    const body = JSON.parse(event.body || "{}");
    if (!body.title?.trim()) return response(400, "title required");

    const svc = TrainingService();
    const row = await svc.addModule(trainingId, body.title, body.sort_order);
    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: "Module created", data: row }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
