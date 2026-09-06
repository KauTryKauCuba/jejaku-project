import { createHash, randomInt } from "crypto";
import { and, desc, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { otpCodes } from "../db/schema";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 120 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFIED_WINDOW_MS = 10 * 60 * 1000;

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

// A Postgres advisory lock keyed by a hash of the email, held for the
// rest of the current transaction — serializes every createOtp/verifyOtp
// call for this email against each other. Chosen over `SELECT ... FOR
// UPDATE` on the otpCodes row itself because a row lock only works once a
// row exists: two concurrent *first-ever* OTP requests for a brand-new
// email both see "no row to lock" and both proceed, bypassing the resend
// cooldown for that one burst. An advisory lock has no such requirement —
// it locks the email itself, not a row that might not exist yet.
async function lockOtpEmail(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], email: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${email}))`);
}

export async function createOtp(email: string) {
  return db.transaction(async (tx) => {
    await lockOtpEmail(tx, email);

    const [recent] = await tx
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (recent) {
      const elapsedMs = Date.now() - recent.createdAt.getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        return { ok: false as const, reason: "cooldown" as const, retryAfterSeconds };
      }
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await tx.insert(otpCodes).values({
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    return { ok: true as const, code };
  });
}

export async function verifyOtp(email: string, code: string) {
  // Locked the same way as createOtp (see lockOtpEmail) — closes the
  // original check-then-increment race on `attempts` (several parallel
  // guesses all reading the same stale count before any of their writes
  // landed, letting more than MAX_ATTEMPTS guesses through), and also
  // means a verify can't interleave with a concurrent createOtp for the
  // same email.
  return db.transaction(async (tx) => {
    await lockOtpEmail(tx, email);

    const [pending] = await tx
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          isNull(otpCodes.consumedAt),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!pending) return { ok: false as const, reason: "expired" as const };
    if (pending.attempts >= MAX_ATTEMPTS) {
      return { ok: false as const, reason: "too_many_attempts" as const };
    }

    if (pending.codeHash !== hashCode(email, code)) {
      await tx
        .update(otpCodes)
        .set({ attempts: pending.attempts + 1 })
        .where(eq(otpCodes.id, pending.id));
      return { ok: false as const, reason: "invalid_code" as const };
    }

    await tx
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(eq(otpCodes.id, pending.id));

    return { ok: true as const };
  });
}

export async function wasRecentlyVerified(email: string) {
  const lastConsumed = await db.query.otpCodes.findFirst({
    where: and(eq(otpCodes.email, email), isNotNull(otpCodes.consumedAt)),
    orderBy: (t) => desc(t.consumedAt),
  });
  if (!lastConsumed?.consumedAt) return false;
  return Date.now() - lastConsumed.consumedAt.getTime() < VERIFIED_WINDOW_MS;
}
