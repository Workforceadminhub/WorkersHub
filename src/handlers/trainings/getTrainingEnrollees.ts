import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canViewTrainingDashboard } from "../../utils/trainingPermissions";
import { parseQueryInt } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canViewTrainingDashboard(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const id = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(id)) return response(400, "Invalid training id");
    const page = parseQueryInt(event, "page", 1);
    const per_page = parseQueryInt(event, "per_page", 20);

    const svc = TrainingService();
    const result = await svc.getEnrollees(id, page, per_page);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Enrollees",
        data: result.data,
        page: result.page,
        per_page: result.per_page,
        total: result.total,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
