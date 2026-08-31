import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { users } from "../../../db/schema";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { fullName } = await request.json();
  if (typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }

  await db.update(users).set({ fullName: fullName.trim() }).where(eq(users.email, email));

  return NextResponse.json({ ok: true });
}
