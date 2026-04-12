import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { createAdmin, type CreateAdminInput } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (req, auth) => {
  try {
    const body = JSON.parse(req.body ?? "{}");
    const code = body.code;
    if (!code || typeof code !== "string" || !code.trim()) {
      return response(400, "code is required (unique identifier / display code for the admin)");
    }

    const isactive = body.isactive !== undefined ? body.isactive : true;
    const emailStr = typeof body.email === "string" ? body.email.trim() : "";
    const passwordStr = typeof body.password === "string" ? body.password : "";
    if (isactive) {
      if (!emailStr) {
        return response(400, "email is required for active accounts");
      }
      if (passwordStr.length < 8) {
        return response(400, "password is required for active accounts (min 8 characters)");
      }
    }

    const permissionLevel = Array.isArray(body.permission_level)
      ? body.permission_level.filter((p: unknown) => typeof p === "string" || typeof p === "number").map((p: string | number) => String(p).trim()).filter(Boolean)
      : undefined;

    const input: CreateAdminInput = {
      code: code.trim(),
      email: emailStr || null,
      initialPassword: passwordStr.length ? passwordStr : null,
      department: body.department ?? null,
      team: body.team ?? null,
      route: body.route ?? null,
      isactive: body.isactive !== undefined ? body.isactive : true,
      permissions: Array.isArray(body.permissions) ? body.permissions.filter((p: unknown) => typeof p === "string").map((p: string) => p.trim()).filter(Boolean) : undefined,
      role: body.role ?? null,
      permission_level: permissionLevel ?? null,
      userinfo: body.userinfo ?? null,
      linked_church_worker_id:
        (body.linked_church_worker_id != null && String(body.linked_church_worker_id).trim() !== ""
          ? String(body.linked_church_worker_id).trim()
          : null) ??
        (body.workerid != null && String(body.workerid).trim() !== ""
          ? String(body.workerid).trim()
          : null),
    };

    const result = await createAdmin(input, auth.userId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Admin created successfully",
        data: result,
      }),
    };
  } catch (err: unknown) {
    console.error("Create admin error:", err);
    if (err instanceof Error && err.message.includes("already exists")) {
      return response(409, err.message);
    }
    return response(500, "Internal Server Error");
  }
});
