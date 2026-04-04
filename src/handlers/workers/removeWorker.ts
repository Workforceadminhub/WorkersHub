import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import WorkersService from "../../services/workers.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async (event, auth) => {
  try {
    const workerId = event?.body ? JSON.parse(event.body).workerid : null;
    const deleteData = event?.body ? JSON.parse(event.body).deleteData : null;

    const reasonfordelete = deleteData?.reasonfordelete;
    const nameofrequester = deleteData?.nameofrequester;
    const roleofrequester = deleteData?.roleofrequester;
    console.log({ auth, workerId, deleteData });

    const service = WorkersService();
    const data = await service.removeWorker(parseInt(workerId), {
      reasonfordelete,
      nameofrequester,
      roleofrequester,
    });

    if (!data) {
      return response(500, "Failed to remove worker.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Workers removal initiated successfully",
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
});
