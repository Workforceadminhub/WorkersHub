import { withRole } from "../../../middleware";
import WorkersService from "../../../services/workers.server";
import { response } from "../../../utils";
import { ROLES_ADMIN_AND_ABOVE } from "../../../utils/enums";

export const handler = withRole(ROLES_ADMIN_AND_ABOVE, async (event, auth) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return response(400, "Worker ID is required.");
    }

    const service = WorkersService();
    const data = await service.getWorker(id.trim());
    if (!data) {
      return response(200, "Worker not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Worker fetched successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
