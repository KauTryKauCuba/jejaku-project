import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { db } from "../../../db";
import { expenses } from "../../../db/schema";

// Deletes only this user's demo-seeded expenses (isDemo = true), leaving
// anything they entered themselves untouched — unlike the Danger Zone's
// full wipe. Demo rows never carry an uploaded photo, so there's no file
// cleanup needed here (contrast with DELETE /api/expenses).
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.userId, user.id), eq(expenses.isDemo, true)))
    .returning({ id: expenses.id });

  return NextResponse.json({ deleted: deleted.length });
}
