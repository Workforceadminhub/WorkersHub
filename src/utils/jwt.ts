// lib/auth.ts
import * as jwt from "jsonwebtoken";
import { Resource } from "sst";

const JWT_SECRET = process.env.JWT_SECRET! || Resource.JWT_SECRET.value;
export const ACCESS_TOKEN_EXPIRY = "120m";
export const REFRESH_TOKEN_EXPIRY = "7d";

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: object) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
