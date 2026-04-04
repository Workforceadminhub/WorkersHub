import { APIGatewayProxyEvent } from "aws-lambda";
import { verifyToken } from "../utils";

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  department?: string | null;
  team?: string | null;
  /** Departments the user can access (from admin.permissions). */
  permissions?: string[];
  /** Admin route (e.g. contains /admin/ for admin access). */
  route?: string | null;
}

export function requireAuth(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  let payload: AuthContext;
  try {
    payload = verifyToken(token) as AuthContext;
  } catch (err) {
    throw new Error("Unauthorized");
  }

  if (!payload || !payload.userId) {
    throw new Error("Unauthorized");
  }

  return payload;
}
