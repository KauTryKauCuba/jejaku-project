import { NextResponse } from "next/server";
import { createOtp } from "../../../lib/otp";
import { sendOtpEmail, type OtpPurpose } from "../../../lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PURPOSES: OtpPurpose[] = ["sign-in", "delete-account"];

export async function POST(request: Request) {
  const { email, purpose } = await request.json();

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  // Only changes the email's wording — the OTP itself works identically
  // either way, so an invalid/omitted purpose just falls back to the
  // generic sign-in copy rather than rejecting the request.
  const resolvedPurpose: OtpPurpose = VALID_PURPOSES.includes(purpose) ? purpose : "sign-in";

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

  await sendOtpEmail(email, result.code, resolvedPurpose);

  return NextResponse.json({ ok: true });
}
