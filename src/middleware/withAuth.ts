// services/functions/auth/withAuth.ts
import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthContext, requireAuth } from "./requireAuth";
import { logAudit, eventFromRoute, metadataFromEvent } from "../services/audit.server";
import { ROLES } from "../utils/enums";

type AuthHandler = (
  event: APIGatewayProxyEvent,
  auth: AuthContext
) => Promise<any>;

function getMethodAndPath(event: APIGatewayProxyEvent): { method: string; path: string } {
  const method =
    (event as any).requestContext?.http?.method ?? event.httpMethod ?? "GET";
  const path = (event as any).rawPath ?? event.path ?? "/";
  return { method, path };
}

export function withAuth(handler: AuthHandler) {
  return async (event: APIGatewayProxyEvent) => {
    try {
      const auth = requireAuth(event);
      const { method, path } = getMethodAndPath(event);
      const isAttendanceAdd =
        method === "POST" &&
        (path === "/api/hub/attendance/add" || path?.startsWith?.("/api/hub/attendance/add"));
      const isAuditFetch =
        method === "GET" && (path === "/api/hub/audit" || path?.startsWith?.("/api/hub/audit"));
      if (!isAttendanceAdd && !isAuditFetch) {
        const metadata = metadataFromEvent(event);
        if (auth.department != null) metadata.department = auth.department;
        if (auth.team != null) metadata.team = auth.team;
        await logAudit({
          userId: auth.userId,
          userCode: auth.email,
          event: eventFromRoute(method, path),
          metadata,
        }).catch(() => {});
      }
      return await handler(event, auth);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Unauthorized" }),
      };
    }
  };
}

export function withRole(roles: string[], handler: AuthHandler) {
  return withAuth(async (event, auth) => {
    // Super admin has access to all routes
    if (auth.role === ROLES.SUPER_ADMIN) {
      return handler(event, auth);
    }
    
    if (!roles.includes(auth.role)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden" }),
      };
    }
    return handler(event, auth);
  });
}
