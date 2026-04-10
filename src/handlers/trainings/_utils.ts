import type { APIGatewayProxyEvent } from "aws-lambda";

/** JWT `userId` is the admin primary key (ULID string). */
export function adminUserIdFromAuth(userId: string | undefined): string {
  return String(userId ?? "").trim();
}

export function pathParamId(event: APIGatewayProxyEvent, key: string): string {
  return String(event.pathParameters?.[key] ?? "").trim();
}

/** Normalize path/body id (ULID or legacy numeric string after migration). */
export function coerceId(raw: unknown): string {
  if (raw == null) return "";
  return typeof raw === "string" ? raw.trim() : String(raw).trim();
}

export function idempotencyKeyFromEvent(event: APIGatewayProxyEvent): string | null {
  const h = event.headers ?? {};
  const v = h["idempotency-key"] ?? h["Idempotency-Key"];
  return v?.trim() || null;
}

export function parseQueryInt(
  event: APIGatewayProxyEvent,
  key: string,
  defaultValue: number,
): number {
  const sp = event.queryStringParameters ?? {};
  const raw = sp[key];
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : defaultValue;
}
