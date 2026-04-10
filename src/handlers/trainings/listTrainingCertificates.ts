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
    const trainingId = pathParamId(event, "id");
    if (!trainingId) return response(400, "Invalid training id");
    const svc = TrainingService();
    const rows = await svc.listCertificatesForTraining(trainingId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Certificates",
        data: rows,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
