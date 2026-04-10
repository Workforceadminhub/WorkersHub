import { APIGatewayProxyEventV2 } from "aws-lambda";
import { resetPasswordWithToken } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) return response(400, "Request body is required.");

  let body: { token?: string; password?: string };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, "Invalid JSON body");
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token.trim() || !password) {
    return response(400, "token and password are required");
  }

  try {
    await resetPasswordWithToken(token, password);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Password has been reset. You can sign in with your new password.",
      }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Invalid or expired") || msg.includes("Token is required")) {
      return response(400, msg);
    }
    if (msg.includes("Password must")) {
      return response(400, msg);
    }
    console.error("Reset password error:", err);
    return response(500, "Internal server error.");
  }
};
