import { withRole } from "../../middleware";
import { ROLES_SUPER_ADMIN_ONLY } from "../../utils/enums";
import { createAdmin, type CreateAdminInput } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = withRole(ROLES_SUPER_ADMIN_ONLY, async (req, auth) => {
  try {
    const body = JSON.parse(req.body ?? "{}");
    const code = body.code;
    if (!code || typeof code !== "string" || !code.trim()) {
      return response(400, "code is required (login code for the admin)");
    }

    const permissionLevel = Array.isArray(body.permission_level)
      ? body.permission_level.filter((p: unknown) => typeof p === "string" || typeof p === "number").map((p: string | number) => String(p).trim()).filter(Boolean)
      : undefined;

    const input: CreateAdminInput = {
      code: code.trim(),
      email: body.email != null ? (typeof body.email === "string" ? body.email.trim() || null : null) : null,
      department: body.department ?? null,
      team: body.team ?? null,
      route: body.route ?? null,
      isactive: body.isactive !== undefined ? body.isactive : true,
      permissions: Array.isArray(body.permissions) ? body.permissions.filter((p: unknown) => typeof p === "string").map((p: string) => p.trim()).filter(Boolean) : undefined,
      role: body.role ?? null,
      permission_level: permissionLevel ?? null,
      userinfo: body.userinfo ?? null,
      workerid: body.workerid != null ? Number(body.workerid) : null,
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
