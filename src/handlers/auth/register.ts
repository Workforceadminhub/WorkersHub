import { APIGatewayProxyEventV2 } from "aws-lambda";
import { registerPublicUser } from "../../services/admin.server";
import { response } from "../../utils";
import { logAudit, metadataFromEvent } from "../../services/audit.server";

export const handler = async (event: APIGatewayProxyEventV2) => {
  if (!event.body) return response(400, "Request body is required.");

  let body: { email?: string; password?: string; firstname?: string; lastname?: string };
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
    const created = await registerPublicUser({
      email,
      password,
      firstname: typeof body.firstname === "string" ? body.firstname : null,
      lastname: typeof body.lastname === "string" ? body.lastname : null,
    });

    logAudit({
      userId: created.id,
      userCode: null,
      event: "user_registered",
      metadata: { ...metadataFromEvent(event), email: created.email },
    }).catch(() => {});

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message:
          "We sent a 6-digit code to your email. Enter it on the verification screen to confirm your address. Your account stays pending administrator approval until then.",
        data: { id: created.id, email: created.email },
      }),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    if (msg.includes("already exists")) {
      return response(409, msg);
    }
    if (msg.includes("Password must") || msg.includes("valid email")) {
      return response(400, msg);
    }
    if (msg.includes("verification email could not be sent")) {
      return response(503, msg);
    }
    console.error("Register error:", err);
    return response(500, "Internal server error.");
  }
};
