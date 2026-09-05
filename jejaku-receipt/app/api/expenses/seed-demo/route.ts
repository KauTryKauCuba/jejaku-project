import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { db } from "../../../db";
import { expenses } from "../../../db/schema";
import { seedDemoExpenses } from "../../../lib/demoData";
import { withApiErrorHandling } from "../../../lib/apiError";

export const POST = withApiErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo and real expenses are distinguishable (isDemo), so this only
  // needs to guard against reloading on top of an existing demo set —
  // any real expenses the user has added are irrelevant here.
  const existingDemo = await db.query.expenses.findFirst({
    where: and(eq(expenses.userId, user.id), eq(expenses.isDemo, true)),
  });
  if (existingDemo) {
    return NextResponse.json(
      { error: "You already have demo data — remove it first if you want to reload it." },
      { status: 409 }
    );
  }

  const count = await seedDemoExpenses(user.id, user.defaultCurrency);
  return NextResponse.json({ seeded: count });
});
