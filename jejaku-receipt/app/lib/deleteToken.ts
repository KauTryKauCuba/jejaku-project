import { createHmac, timingSafeEqual } from "crypto";

// A short-lived, self-contained proof that this specific email just passed
// OTP verification for an account deletion — checked server-side by both
// apps' delete endpoints (not just performed client-side before they're
// called) so a stolen/replayed session cookie alone can't trigger a
// deletion without ever seeing the emailed code. Signed with AUTH_SECRET,
// which both apps already share (it's what lets jejaku-receipt decode the
// same session cookie jejaku issues) — a stateless HMAC needs no shared
// table between the two separate databases.
const TOKEN_TTL_MS = 5 * 60 * 1000;

function sign(email: string, expiresAt: number): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`${email}:${expiresAt}`)
    .digest("hex");
}

export function issueDeleteToken(email: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return `${Buffer.from(email).toString("base64url")}.${expiresAt}.${sign(email, expiresAt)}`;
}

// Verifies the token was issued for exactly this email and hasn't expired.
// Not tied to who *currently* holds the session — the caller is
// responsible for checking the token's email matches the session it's
// being used with.
export function verifyDeleteToken(token: string, email: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [encodedEmail, expiresAtRaw, signature] = parts;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  let decodedEmail: string;
  try {
    decodedEmail = Buffer.from(encodedEmail, "base64url").toString();
  } catch {
    return false;
  }
  if (decodedEmail !== email) return false;

  const expected = Buffer.from(sign(email, expiresAt));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
