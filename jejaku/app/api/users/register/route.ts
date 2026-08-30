import { NextResponse } from "next/server";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { wasRecentlyVerified } from "../../../lib/otp";

export async function POST(request: Request) {
  const { email, fullName, avatarUrl } = await request.json();

  if (typeof email !== "string" || typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Missing email or name." }, { status: 400 });
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
