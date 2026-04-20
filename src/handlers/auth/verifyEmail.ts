import { APIGatewayProxyEventV2 } from "aws-lambda";
import { verifyEmailWithOtp } from "../../services/admin.server";
import { response } from "../../utils";

function parseBody(event: APIGatewayProxyEventV2): { email?: string; otp?: string } {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body) as { email?: string; otp?: string };
  } catch {
    return {};
  }
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  const method = event.requestContext?.http?.method ?? "GET";

  if (method === "GET") {
    return response(
      400,
      'Verification uses a 6-digit code. POST JSON: {"email":"you@example.com","otp":"123456"}',
    );
  }

  if (method !== "POST") {
    return response(405, "Method not allowed");
  }

  const body = parseBody(event);
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp : "";

  if (!email || !otp) {
    return response(400, 'email and otp are required (POST JSON: {"email":"...","otp":"123456"})');
  }

  try {
    await verifyEmailWithOtp(email, otp);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email verified. You can sign in once an administrator has activated your account.",
      }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (
      msg.includes("Invalid or expired") ||
      msg.includes("6-digit") ||
      msg.includes("valid email")
    ) {
      return response(400, msg);
    }
    console.error("Verify email error:", err);
    return response(500, "Internal server error.");
  }
};
