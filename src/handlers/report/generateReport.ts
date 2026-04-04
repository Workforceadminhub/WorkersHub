import { withRole } from "../../middleware";
import WorkersService from "../../services/workers.server";
import { response } from "../../utils";

export const handler = async (event: any) => {
  try {
    const service = WorkersService();
    await service.sendWeeklyWorkerReport();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Worker report generated successfully",
      }),
    };
  } catch (err) {
    console.log(err);
    return response(500, "Internal Server Error");
  }
};
