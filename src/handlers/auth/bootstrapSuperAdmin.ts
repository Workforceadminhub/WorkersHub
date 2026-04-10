import { APIGatewayProxyEventV2 } from "aws-lambda";
import { bootstrapSuperAdmin } from "../../services/admin.server";
import { response } from "../../utils";
import { logAudit, metadataFromEvent } from "../../services/audit.server";

function bootstrapSecretFromEvent(event: APIGatewayProxyEventV2): string | null {
  const h = event.headers ?? {};
  const v = h["x-bootstrap-secret"] ?? h["X-Bootstrap-Secret"];
  return v?.trim() || null;
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) return response(400, "Request body is required.");

  let body: { email?: string; password?: string; code?: string };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, "Invalid JSON body");
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email.trim() || !password) {
    return response(400, "email and password are required");
  }

  try {
    const created = await bootstrapSuperAdmin({
      email,
      password,
      code: typeof body.code === "string" ? body.code : null,
      bootstrapSecret: bootstrapSecretFromEvent(event),
    });

    logAudit({
      userId: created.id,
      userCode: null,
      event: "super_admin_bootstrapped",
      metadata: { ...metadataFromEvent(event), email: created.email },
    }).catch(() => {});

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Super admin created. You can sign in with email and password.",
        data: { id: created.id, email: created.email },
      }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bootstrap failed";
    if (msg.includes("already exists") || msg.includes("Bootstrap is disabled") || msg.includes("code is already")) {
      return response(409, msg);
    }
    if (msg.includes("Invalid bootstrap secret")) {
      return response(401, msg);
    }
    if (msg.includes("Password must") || msg.includes("valid email")) {
      return response(400, msg);
    }
    console.error("Bootstrap super admin error:", err);
    return response(500, "Internal server error.");
  }
};
