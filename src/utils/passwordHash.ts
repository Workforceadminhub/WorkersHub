import * as bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string | null | undefined): boolean {
  if (!hash || !plain) return false;
  return bcrypt.compareSync(plain, hash);
}
