import { APIGatewayProxyEventV2 } from "aws-lambda";
import AuthService from "../../services/auth.server";
import { response } from "../../utils";
import { logAudit, metadataFromEvent } from "../../services/audit.server";

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { password } = JSON.parse(event.body || "{}");
  const service = AuthService();
  if (!event.body) return response(400, "Request body is required.");

  try {
    const res = await service.login({ password });

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
          route: res.user.route,
          department: res.user.department,
          team: res.user.team,
          permissions: (res.user as { permissions?: string[] }).permissions ?? [],
          role: (res.user as { role?: string }).role ?? null,
          code: null,
        },
      }),
    };
  } catch (error: any) {
    console.error("Login error:", error);
    if (error.message.includes("Invalid email or password.")) {
      return response(400, "Invalid login code");
    }

    if (error.message.includes("User not verified")) {
      return response(404, "User not verified");
    }

    return response(500, "Internal server error.");
  }
};
