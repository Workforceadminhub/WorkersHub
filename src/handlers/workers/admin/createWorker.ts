import { withRole } from "../../../middleware";
import WorkersService from "../../../services/workers.server";
import { response } from "../../../utils";
import { ROLES_ADMIN_AND_ABOVE } from "../../../utils/enums";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    if (!event.body) {
      return response(400, "Request body is required.");
    }
    const worker = JSON.parse(event.body || "{}");

    const service = WorkersService();
    const data = await service.createWorker(worker);
    if (!data) {
      return response(500, "Failed to add worker.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Workers added successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
