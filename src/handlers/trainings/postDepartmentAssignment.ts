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
    const worker_id = parseInt(String(body.user_id ?? body.worker_id ?? ""), 10);
    const department_id = parseInt(String(body.department_id ?? ""), 10);
    const start_date = String(body.start_date ?? "").slice(0, 10);
    const required_duration_days = parseInt(String(body.required_duration_days ?? ""), 10);

    if (!Number.isFinite(worker_id) || !Number.isFinite(department_id) || !start_date) {
      return response(400, "worker_id, department_id, start_date required");
    }
    if (!Number.isFinite(required_duration_days) || required_duration_days < 1) {
      return response(400, "required_duration_days must be a positive integer");
    }

    const svc = TrainingService();
    const row = await svc.addDepartmentAssignment({
      worker_id,
      department_id,
      training_id: trainingId,
      start_date,
      required_duration_days,
    });
    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: "Assignment created", data: row }),
    };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("Department not found")) return response(404, msg);
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
