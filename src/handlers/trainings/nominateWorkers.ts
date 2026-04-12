import { withAuth } from "../../middleware";
import TrainingService from "../../services/training.server";
import { response } from "../../utils";
import { ROLES } from "../../utils/enums";
import { canNominateWorkers } from "../../utils/trainingPermissions";
import { coerceId, idempotencyKeyFromEvent, pathParamId } from "./_utils";

export const handler = withAuth(async (event, auth) => {
  if (!canNominateWorkers(auth)) {
    return { statusCode: 403, body: JSON.stringify({ success: false, message: "Forbidden" }) };
  }
  try {
    const trainingId = pathParamId(event, "id");
    if (!trainingId) return response(400, "Invalid training id");

    const body = JSON.parse(event.body || "{}");
    const rawIds = body.worker_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return response(400, "worker_ids array required");
    }
    const workerIds = rawIds.map((x: unknown) => coerceId(x)).filter(Boolean);
    if (workerIds.length === 0) return response(400, "worker_ids must contain valid ids");

    const nominationSource =
      auth.role === ROLES.SUPER_ADMIN ||
      auth.role === ROLES.ADMIN ||
      auth.role === ROLES.CHURCH_ADMIN ||
      auth.role === ROLES.WF_ADMIN
        ? ("staff" as const)
        : ("leader" as const);

    const svc = TrainingService();
    const result = await svc.nominateWorkers({
      trainingId,
      workerIds,
      nominationSource,
      idempotencyKey: idempotencyKeyFromEvent(event),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: result.replayed ? "Idempotent replay" : "Nomination processed",
        data: result.results,
        replayed: result.replayed,
      }),
    };
  } catch (e) {
    console.error(e);
    return response(500, "Internal Server Error");
  }
});
