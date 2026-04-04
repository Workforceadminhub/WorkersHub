import { withRole } from "../../../middleware";
import WorkersService from "../../../services/workers.server";
import { response } from "../../../utils";
import { ROLES_WITH_USER_ACCESS } from "../../../utils/enums";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    if (!event.body) {
      return response(400, "Request body is required.");
    }
    const worker = JSON.parse(event.body || "{}");

    if(!worker.id){
      return response(400, "Worker id is needed")
    }

    const service = WorkersService();
    const data = await service.updateWorker(worker.id, worker);
    if (!data) {
      return response(500, "Failed to update worker.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Worker updated successfully",
        data,
      }),
    };
  } catch (err: any) {
    console.log(err);
    if (err.message === "Worker not found") {
      return response(400, "Worker does not exist.");
    }
    return response(500, "Internal Server Error");
  }
});
