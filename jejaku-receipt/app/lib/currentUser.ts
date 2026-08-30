import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "../db";
import { users } from "../db/schema";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.otpConfirmed || !session.dbProfile) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.dbProfile.email),
  });
  return user ?? null;
}
