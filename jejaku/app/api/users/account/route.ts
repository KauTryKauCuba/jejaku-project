import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { verifyDeleteToken } from "../../../lib/deleteToken";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { withApiErrorHandling } from "../../../lib/apiError";

export const DELETE = withApiErrorHandling("DELETE /api/users/account", async (request: NextRequest) => {
  const session = await auth();
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Proves an OTP code was verified for this specific email within the
  // last few minutes (see lib/deleteToken.ts and
  // account/delete-token/route.ts) — checked here rather than trusted from
  // the client's own gating, so a stolen/replayed session cookie alone
  // can't trigger a deletion without ever seeing the emailed code.
  const token = request.headers.get("x-delete-token");
  if (!token || !verifyDeleteToken(token, email)) {
    return NextResponse.json({ error: "Verification required." }, { status: 403 });
  }

  await db.delete(users).where(eq(users.email, email));

  return NextResponse.json({ ok: true });
});
