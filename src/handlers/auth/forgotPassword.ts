import { APIGatewayProxyEventV2 } from "aws-lambda";
import { requestPasswordReset } from "../../services/admin.server";
import { response } from "../../utils";

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) return response(400, "Request body is required.");

  let body: { email?: string };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, "Invalid JSON body");
  }

  const email = typeof body.email === "string" ? body.email : "";
  if (!email.trim()) {
    return response(400, "email is required");
  }

  try {
    await requestPasswordReset(email);
  } catch (e) {
    console.error("Forgot password error:", e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "If an account exists for that email, password reset instructions have been sent.",
    }),
  };
};
