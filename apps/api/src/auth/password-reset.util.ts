// Pure code generation, DB-free so it's unit-testable (persistence/expiry
// checks are the caller's responsibility, in AuthService).

import { randomInt } from "crypto";

export const RESET_CODE_TTL_MS = 15 * 60 * 1000;

export function generateResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
