import { APIGatewayProxyEventV2 } from "aws-lambda";
import AuthService from "../../services/auth.server";
import { response } from "../../utils";
import { logAudit, metadataFromEvent } from "../../services/audit.server";

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) return response(400, "Request body is required.");

  let body: { email?: string; password?: string };
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

  const service = AuthService();

  try {
    const res = await service.login({ email, password });

    logAudit({
      userId: res.user.id,
      userCode: res.user.code,
      event: "login",
      metadata: metadataFromEvent(event),
    }).catch(() => {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: res.accessToken,
        user: {
          id: res.user.id,
          email: res.user.email,
          route: res.user.route,
          department: res.user.department,
          team: res.user.team,
          permissions: (res.user as { permissions?: string[] }).permissions ?? [],
          role: (res.user as { role?: string }).role ?? null,
        },
      }),
    };
  } catch (error: unknown) {
    console.error("Login error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Invalid email or password")) {
      return response(400, "Invalid email or password");
    }
    if (msg.includes("pending approval")) {
      return response(403, msg);
    }
    if (msg.includes("verify your email")) {
      return response(403, msg);
    }
    if (msg.includes("User not verified")) {
      return response(404, "User not verified");
    }
    return response(500, "Internal server error.");
  }
};
