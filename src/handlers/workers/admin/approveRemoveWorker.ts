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
    const data = await service.approveRemoveWorker(parseInt(id));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Workers updated successfully",
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
