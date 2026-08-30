import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyOtp } from "../../../lib/otp";
import { db } from "../../../db";
import { users } from "../../../db/schema";

const REASON_MESSAGES: Record<string, string> = {
  expired: "That code has expired. Request a new one.",
  invalid_code: "That code isn't right. Try again.",
  too_many_attempts: "Too many attempts. Request a new code.",
};

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Missing email or code." }, { status: 400 });
  }

  const result = await verifyOtp(email, code);

  if (!result.ok) {
    return NextResponse.json(
      { error: REASON_MESSAGES[result.reason] ?? "Verification failed." },
      { status: 400 }
    );
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  return NextResponse.json({
    ok: true,
    profile: existing
      ? { fullName: existing.fullName, avatarUrl: existing.avatarUrl ?? undefined }
      : null,
  });
}
