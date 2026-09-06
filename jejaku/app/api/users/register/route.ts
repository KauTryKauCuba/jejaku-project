import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { wasRecentlyVerified } from "../../../lib/otp";

export async function POST(request: Request) {
  // The target email always comes from the caller's own session, never
  // from the request body — otherwise anyone who knows a victim's email
  // could race their own onboarding request during the same
  // wasRecentlyVerified window (opened by the victim's own real sign-in)
  // and set that victim's initial display name/avatar themselves.
  const session = await auth();
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { fullName, avatarUrl } = await request.json();

  if (typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Missing name." }, { status: 400 });
  }
  if (avatarUrl !== undefined && typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "Invalid avatar." }, { status: 400 });
  }

  if (!(await wasRecentlyVerified(email))) {
    return NextResponse.json({ error: "Verify your email first." }, { status: 403 });
  }

  await db
    .insert(users)
    .values({ email, fullName: fullName.trim(), avatarUrl: avatarUrl ?? null })
    .onConflictDoNothing({ target: users.email });

  return NextResponse.json({ ok: true });
}
