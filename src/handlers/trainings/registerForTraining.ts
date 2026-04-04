import { withAuth } from "../../middleware";
import TrainingService, { resolveWorkerIdFromAdminUser } from "../../services/training.server";
import { response } from "../../utils";
import { ROLES } from "../../utils/enums";
import { canNominateWorkers } from "../../utils/trainingPermissions";
import { adminUserIdFromAuth, idempotencyKeyFromEvent } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  try {
    const trainingId = parseInt(event.pathParameters?.id ?? "", 10);
    if (!Number.isFinite(trainingId)) return response(400, "Invalid training id");

    const body = JSON.parse(event.body || "{}");
    const adminId = adminUserIdFromAuth(auth.userId);
    let workerId: number | null = null;

    if (body.worker_id != null && canNominateWorkers(auth)) {
      workerId = parseInt(String(body.worker_id), 10);
    } else {
      workerId = await resolveWorkerIdFromAdminUser(adminId);
    }

    if (workerId == null || !Number.isFinite(workerId)) {
      return response(403, "No worker profile linked to this account");
    }

    const isSelf =
      auth.role === ROLES.USER ||
      auth.role === ROLES.WORKER ||
      (!canNominateWorkers(auth) && body.worker_id == null);

    if (isSelf && body.worker_id != null) {
      return response(403, "Cannot register another worker with this account");
    }

    const nominationSource: "self" | "admin" | "leader" = isSelf
      ? "self"
      : auth.role === ROLES.SUPER_ADMIN ||
          auth.role === ROLES.ADMIN ||
          auth.role === ROLES.CHURCH_ADMIN ||
          auth.role === ROLES.WF_ADMIN
        ? "admin"
        : "leader";

    const svc = TrainingService();
    const idem = idempotencyKeyFromEvent(event);
    const result = await svc.enrollWorker({
      trainingId,
      workerId,
      nominationSource,
      idempotencyKey: idem,
    });

    const base =
      process.env.TRAINING_REGISTRATION_BASE_URL ||
      process.env.FRONTEND_URL ||
      "";
    return {
      statusCode: result.already_enrolled ? 200 : 201,
      body: JSON.stringify({
        success: true,
        message: result.already_enrolled ? "Already enrolled" : "Registered",
        data: {
          enrollment_id: result.enrollment.id,
          enrollment_type: result.enrollment_type,
          already_enrolled: result.already_enrolled,
          registration_link: base ? `${base.replace(/\/$/, "")}/trainings/register` : undefined,
        },
      }),
    };
  } catch (e) {
    console.error(e);
    const msg = (e as Error).message;
    if (msg.includes("deadline") || msg.includes("capacity")) return response(400, msg);
    return response(400, msg || "Bad request");
  }
});
