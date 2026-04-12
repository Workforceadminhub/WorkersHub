import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { updateAdmin, type UpdateAdminFields } from "../../services/admin.server";
import { response } from "../../utils";

const ALLOWED_KEYS: (keyof UpdateAdminFields)[] = [
  "email",
  "code",
  "department",
  "team",
  "route",
  "isactive",
  "userinfo",
  "linked_church_worker_id",
];

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (req, _auth) => {
  try {
    const id = req.pathParameters?.id;
    if (!id) {
      return response(400, "Admin id is required");
    }
    const adminId = id.trim();
    if (!adminId) {
      return response(400, "Invalid admin id");
    }

    const body = JSON.parse(req.body ?? "{}") as Record<string, unknown>;
    const fields: UpdateAdminFields = {};
    for (const key of ALLOWED_KEYS) {
      if (key === "linked_church_worker_id") {
        if (!("linked_church_worker_id" in body) && !("workerid" in body)) continue;
        const raw = body.workerid ?? body.linked_church_worker_id;
        const s = raw == null ? "" : String(raw).trim();
        fields.linked_church_worker_id = s ? s : null;
        continue;
      }
      if (key in body && body[key] !== undefined) {
        const v = body[key];
        if (key === "isactive") {
          fields[key] = v === true || v === false ? v : null;
        } else {
          fields[key] = typeof v === "string" ? v.trim() || null : v == null ? null : String(v);
        }
      }
    }

    const result = await updateAdmin(adminId, fields);
    if (!result) {
      return response(404, "Admin not found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Admin updated successfully",
        data: result,
      }),
    };
  } catch (err) {
    console.error("Update admin error:", err);
    return response(500, "Internal Server Error");
  }
});
