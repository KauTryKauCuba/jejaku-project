import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { saveAvatarPhoto } from "../../../lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  // dbProfile only exists once a users row has been created (post-onboarding).
  // Fall back to the raw session email so this also works during onboarding,
  // when the row doesn't exist yet — register still saves the returned URL.
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  let avatarUrl: string;
  try {
    avatarUrl = await saveAvatarPhoto(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't save photo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await db.update(users).set({ avatarUrl }).where(eq(users.email, email));

  return NextResponse.json({ avatarUrl });
}
