import { createHash, randomInt } from "crypto";
import { and, desc, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { db } from "../db";
import { otpCodes } from "../db/schema";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 120 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFIED_WINDOW_MS = 10 * 60 * 1000;

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function createOtp(email: string) {
  const recent = await db.query.otpCodes.findFirst({
    where: and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  if (recent) {
    const elapsedMs = Date.now() - recent.createdAt.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
      return { ok: false as const, reason: "cooldown" as const, retryAfterSeconds };
    }
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.insert(otpCodes).values({
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  return { ok: true as const, code };
}

export async function verifyOtp(email: string, code: string) {
  const pending = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.email, email),
      isNull(otpCodes.consumedAt),
      gt(otpCodes.expiresAt, new Date())
    ),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  if (!pending) return { ok: false as const, reason: "expired" as const };
  if (pending.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: "too_many_attempts" as const };
  }

  if (pending.codeHash !== hashCode(email, code)) {
    await db
      .update(otpCodes)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(otpCodes.id, pending.id));
    return { ok: false as const, reason: "invalid_code" as const };
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, pending.id));

  return { ok: true as const };
}

export async function wasRecentlyVerified(email: string) {
  const lastConsumed = await db.query.otpCodes.findFirst({
    where: and(eq(otpCodes.email, email), isNotNull(otpCodes.consumedAt)),
    orderBy: (t) => desc(t.consumedAt),
  });
  if (!lastConsumed?.consumedAt) return false;
  return Date.now() - lastConsumed.consumedAt.getTime() < VERIFIED_WINDOW_MS;
}
