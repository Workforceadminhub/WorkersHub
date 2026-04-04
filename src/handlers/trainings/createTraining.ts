import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { canCreateTrainingAndCurriculum } from "../../utils/trainingPermissions";
import { adminUserIdFromAuth } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canCreateTrainingAndCurriculum(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const adminId = adminUserIdFromAuth(auth.userId);
    if (!Number.isFinite(adminId) || adminId < 1) {
      return response(400, "Invalid admin user");
    }
    const svc = TrainingService();
    const result = await svc.createTraining(
      {
        name: body.name,
        description: body.description,
        cohort: body.cohort,
        start_date: body.start_date,
        end_date: body.end_date,
        category: body.category,
        facilitator: body.facilitator,
        mode: body.mode,
        duration: body.duration,
        capacity: body.capacity,
        registration_deadline: body.registration_deadline,
        template_slug: body.template_slug,
      },
      adminId,
    );
    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Training created",
        data: result,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(400, (e as Error).message || "Bad request");
  }
});
