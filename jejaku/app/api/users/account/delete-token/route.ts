import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { verifyOtp } from "../../../../lib/otp";
import { issueDeleteToken } from "../../../../lib/deleteToken";
import { withApiErrorHandling } from "../../../../lib/apiError";

const REASON_TO_ERROR: Record<string, string> = {
  expired: "otp_expired",
  too_many_attempts: "otp_too_many_attempts",
  invalid_code: "otp_invalid",
};

// Verifies the code directly against verifyOtp — deliberately not routed
// through signIn("otp", ...) (the same Credentials provider used at
// login), since this isn't a real sign-in: no need to touch lastSignInAt
// or re-issue the session. What this proves — "the current session's
// owner just entered a valid code" — is exactly what the delete
// endpoints need before they'll act, checked server-side by them rather
// than trusted from the client's own gating.
export const POST = withApiErrorHandling("POST /api/users/account/delete-token", async (request: Request) => {
  const session = await auth();
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { code } = await request.json();
  if (typeof code !== "string") {
    return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
  }

  const result = await verifyOtp(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: REASON_TO_ERROR[result.reason] ?? "otp_invalid" }, { status: 400 });
  }

  return NextResponse.json({ token: issueDeleteToken(email) });
});
