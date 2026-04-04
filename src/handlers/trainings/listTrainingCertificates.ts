import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canViewTrainingDashboard } from "../../utils/trainingPermissions";

export const handler = withAuth(async (event, auth) => {
  if (!canViewTrainingDashboard(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(trainingId)) return response(400, "Invalid training id");
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
