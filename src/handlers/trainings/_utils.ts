import type { APIGatewayProxyEvent } from "aws-lambda";

export function adminUserIdFromAuth(userId: string | undefined): number {
  const n = parseInt(String(userId ?? ""), 10);
  return n;
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
