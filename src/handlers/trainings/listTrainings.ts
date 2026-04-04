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
    const page = parseQueryInt(event, "page", 1);
    const per_page = parseQueryInt(event, "per_page", 20);
    const sp = event.queryStringParameters ?? {};
    const search = sp.search ?? null;
    const category = sp.category ?? null;
    const status = (sp.status as "upcoming" | "ongoing" | "completed" | undefined) ?? null;

    const svc = TrainingService();
    const result = await svc.listTrainings({
      page,
      per_page,
      search,
      category,
      status: status ?? null,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Trainings fetched",
        data: result.data,
        page: result.page,
        per_page: result.per_page,
        total: result.total,
        metrics: result.metrics,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
