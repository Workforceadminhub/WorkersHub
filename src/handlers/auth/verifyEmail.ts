import { APIGatewayProxyEventV2 } from "aws-lambda";
import { verifyEmailWithToken } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = async (event: APIGatewayProxyEventV2) => {
  const fromQuery = event.queryStringParameters?.token?.trim() || "";
  let token = fromQuery;
  if (!token && event.body) {
    try {
      const b = JSON.parse(event.body) as { token?: string };
      token = typeof b.token === "string" ? b.token.trim() : "";
    } catch {
      return response(400, "Invalid JSON body");
    }
  }

  if (!token) {
    return response(400, "token is required (use GET ?token=... or POST body { \"token\": \"...\" })");
  }

  try {
    await verifyEmailWithToken(token);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email verified. You can sign in once an administrator has activated your account.",
      }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Invalid or expired") || msg.includes("Token is required")) {
      return response(400, msg);
    }
    console.error("Verify email error:", err);
    return response(500, "Internal server error.");
  }
};
