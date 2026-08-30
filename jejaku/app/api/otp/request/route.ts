import { NextResponse } from "next/server";
import { createOtp } from "../../../lib/otp";
import { sendOtpEmail } from "../../../lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await createOtp(email);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: `Please wait ${result.retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  await sendOtpEmail(email, result.code);

  return NextResponse.json({ ok: true });
}
