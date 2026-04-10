import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canViewTrainingDashboard } from "../../utils/trainingPermissions";
import { pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canViewTrainingDashboard(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const id = pathParamId(event, "id");
    if (!id) return response(400, "Invalid training id");
    const svc = TrainingService();
    const tr = await svc.getTrainingById(id);
    if (!tr) return response(404, "Training not found");
    const curriculum = await svc.getCurriculum(id);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Curriculum",
        data: { training_id: id, modules: curriculum },
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
