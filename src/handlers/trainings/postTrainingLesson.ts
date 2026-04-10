import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canCreateTrainingAndCurriculum } from "../../utils/trainingPermissions";
import { pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canCreateTrainingAndCurriculum(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = pathParamId(event, "id");
    const moduleId = pathParamId(event, "moduleId");
    if (!trainingId || !moduleId) {
      return response(400, "Invalid ids");
    }

    const body = JSON.parse(event.body || "{}");
    if (!body.title?.trim()) return response(400, "title required");

    const svc = TrainingService();
    await svc.assertModuleBelongsToTraining(moduleId, trainingId);
    const row = await svc.addLesson(moduleId, body.title, body.content ?? null, body.sort_order);
    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: "Lesson created", data: row }),
    };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("Module not found")) return response(404, msg);
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
