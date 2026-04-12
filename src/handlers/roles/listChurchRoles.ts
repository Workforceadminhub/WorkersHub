import { withRole } from "../../middleware";
import { ROLES_WITH_USER_ACCESS } from "../../utils/enums";
import { response } from "../../utils";
import { db } from "../../database/db.server";

export const handler = withRole(ROLES_WITH_USER_ACCESS, async () => {
  try {
    const roles = await db
      .selectFrom("church_role")
      .select(["code", "label", "description", "sort_order", "is_active"])
      .where("is_active", "=", true)
      .orderBy("sort_order", "asc")
      .orderBy("label", "asc")
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Roles fetched successfully",
        data: roles,
      }),
    };
  } catch (err) {
    console.error("Error listing roles:", err);
    return response(500, "Internal Server Error");
  }
});
