import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "../../lib/currentUser";
import { saveExpensePhoto } from "../../lib/uploads";
import { db } from "../../db";
import { expenses } from "../../db/schema";
import { EXPENSE_CATEGORIES, type Expense } from "../../lib/expenses";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toExpense(row: typeof expenses.$inferSelect): Expense {
  return {
    id: row.id,
    merchant: row.merchant,
    amount: row.amount,
    date: row.date,
    category: row.category as Expense["category"],
    note: row.note ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.expenses.findMany({
    where: eq(expenses.userId, user.id),
    orderBy: desc(expenses.createdAt),
  });

  return NextResponse.json(rows.map(toExpense));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const merchant = typeof form.get("merchant") === "string" ? (form.get("merchant") as string).trim() : "";
  const amount = Number(form.get("amount"));
  const date = typeof form.get("date") === "string" ? (form.get("date") as string) : "";
  const category = typeof form.get("category") === "string" ? (form.get("category") as string) : "";
  const noteRaw = form.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  const photo = form.get("photo");

  if (
    !merchant ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !DATE_PATTERN.test(date) ||
    !EXPENSE_CATEGORIES.includes(category as Expense["category"])
  ) {
    return NextResponse.json({ error: "Invalid expense data." }, { status: 400 });
  }

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveExpensePhoto(photo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save photo.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const [row] = await db
    .insert(expenses)
    .values({
      userId: user.id,
      merchant,
      amount,
      date,
      category,
      note: note || null,
      photoUrl,
    })
    .returning();

  return NextResponse.json(toExpense(row));
}
