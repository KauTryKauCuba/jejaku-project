import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../lib/currentUser";
import { db } from "../../db";
import { users } from "../../db/schema";
import { EXPENSE_CATEGORIES, MAX_CATEGORY_LENGTH, MAX_CUSTOM_CATEGORIES } from "../../lib/expenses";
import { AUDIT_ACTIONS, logAudit } from "../../lib/auditLog";
import { withApiErrorHandling } from "../../lib/apiError";

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name || name.length > MAX_CATEGORY_LENGTH) {
    return NextResponse.json(
      { error: `Category must be 1-${MAX_CATEGORY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const existing = [...EXPENSE_CATEGORIES, ...user.customCategories];
  if (existing.some((c) => c.toLowerCase() === name.toLowerCase())) {
    // Already usable (built-in or already added) — treat as a no-op success
    // rather than an error, since the user's intent ("I want this category
    // available") is already satisfied.
    return NextResponse.json({ customCategories: user.customCategories });
  }

  if (user.customCategories.length >= MAX_CUSTOM_CATEGORIES) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_CUSTOM_CATEGORIES} custom categories.` },
      { status: 400 }
    );
  }

  const customCategories = [...user.customCategories, name];
  await db.update(users).set({ customCategories }).where(eq(users.id, user.id));
  await logAudit(user.id, AUDIT_ACTIONS.CATEGORY_CREATED, name);

  return NextResponse.json({ customCategories });
});
