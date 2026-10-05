import { createHash, randomInt } from "crypto";

// Unambiguous alphabet: no 0/O or 1/I, so a code read aloud or handwritten
// by an org admin is never misheard as another valid character.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// One-time exam access PIN, e.g. "K7X9-MQ3P". High-entropy and generated
// server-side, so it is hashed with a fast hash (see hashAccessCode), not
// bcrypt - bcrypt's slow-hash design goal is for low-entropy human-chosen
// passwords, which this is not.
export function generateAccessCode(): string {
  const chars = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function hashAccessCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Temporary account password for an org-provisioned candidate. Unlike the
// access code, this goes through the normal bcrypt path in AuthService /
// OrganizationsService, since it becomes a real User.passwordHash. Built
// from a fixed alphabet (not base64) so the length is always exact - no
// truncation surprises from stripping padding/symbol characters afterwards.
export function generateTempPassword(): string {
  return Array.from({ length: 12 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");
}
