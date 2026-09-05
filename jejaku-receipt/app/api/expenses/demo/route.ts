import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { db } from "../../../db";
import { expenses } from "../../../db/schema";
import { AUDIT_ACTIONS, logAudit } from "../../../lib/auditLog";
import { withApiErrorHandling } from "../../../lib/apiError";

// Deletes only this user's demo-seeded expenses (isDemo = true), leaving
// anything they entered themselves untouched — unlike the Danger Zone's
// full wipe. Demo rows never carry an uploaded photo, so there's no file
// cleanup needed here (contrast with DELETE /api/expenses).
export const DELETE = withApiErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.userId, user.id), eq(expenses.isDemo, true)))
    .returning({ id: expenses.id });

  if (deleted.length > 0) {
    await logAudit(user.id, AUDIT_ACTIONS.DEMO_REMOVED, `${deleted.length} sample receipts`);
  }

  return NextResponse.json({ deleted: deleted.length });
});
