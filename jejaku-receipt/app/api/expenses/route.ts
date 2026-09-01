import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "../../lib/currentUser";
import { saveExpensePhoto, UPLOADS_DIR } from "../../lib/uploads";
import { convertCurrency } from "../../lib/exchangeRates";
import { db } from "../../db";
import { expenses } from "../../db/schema";
import { toExpense } from "../../db/toExpense";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, formatCurrency, type ExpenseItem } from "../../lib/expenses";
import { AUDIT_ACTIONS, logAudit } from "../../lib/auditLog";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

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
  const taxRaw = form.get("tax");
  const tax = typeof taxRaw === "string" && taxRaw ? Number(taxRaw) : null;
  const isWarrantyClaim = form.get("isWarrantyClaim") === "true";
  const noteRaw = form.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  const locationRaw = form.get("location");
  const location = typeof locationRaw === "string" ? locationRaw.trim() : "";
  const currencyRaw = form.get("currency");
  const currency =
    typeof currencyRaw === "string" && CURRENCY_CODE_PATTERN.test(currencyRaw.toUpperCase())
      ? currencyRaw.toUpperCase()
      : "";
  const photo = form.get("photo");

  const itemsRaw = form.get("items");
  let items: ExpenseItem[] | null = null;
  if (typeof itemsRaw === "string" && itemsRaw) {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        items = parsed.filter(
          (item): item is ExpenseItem =>
            typeof item === "object" &&
            item !== null &&
            typeof item.name === "string" &&
            typeof item.price === "number" &&
            Number.isFinite(item.price)
        );
      }
    } catch {
      // Malformed items payload — save the expense without them rather
      // than rejecting the whole submission over a non-essential field.
      items = null;
    }
  }

  if (
    !merchant ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !DATE_PATTERN.test(date) ||
    !((EXPENSE_CATEGORIES as readonly string[]).includes(category) || user.customCategories.includes(category)) ||
    (tax !== null && (!Number.isFinite(tax) || tax < 0))
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

  // Snapshot into the user's home currency now, at save time, rather than
  // converting live on every dashboard read — see the comment on the
  // schema columns for why. A failed/unreachable FX lookup shouldn't block
  // saving the expense itself, so this degrades to null (excluded from
  // aggregate totals) rather than erroring the whole request.
  const expenseCurrency = currency || DEFAULT_CURRENCY;
  const homeCurrencyAmount = await convertCurrency(amount, expenseCurrency, user.defaultCurrency);
  if (homeCurrencyAmount === null) {
    console.error(
      "[expenses] currency conversion failed",
      expenseCurrency, "->", user.defaultCurrency
    );
  }

  const [row] = await db
    .insert(expenses)
    .values({
      userId: user.id,
      merchant,
      amount,
      date,
      category,
      tax,
      isWarrantyClaim,
      note: note || null,
      photoUrl,
      location: location || null,
      currency: currency || null,
      homeCurrencyAmount,
      homeCurrencyCode: homeCurrencyAmount === null ? null : user.defaultCurrency,
      items: items && items.length > 0 ? items : null,
    })
    .returning();

  await logAudit(
    user.id,
    AUDIT_ACTIONS.EXPENSE_CREATED,
    `${merchant} — ${formatCurrency(amount, currency || DEFAULT_CURRENCY)}`
  );

  return NextResponse.json(toExpense(row));
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(expenses)
    .where(eq(expenses.userId, user.id))
    .returning({ photoUrl: expenses.photoUrl });

  // Best-effort cleanup of this user's uploaded receipt photos — a failed
  // unlink (already missing, permissions, etc.) shouldn't block the bulk
  // delete from completing, since the DB rows are already gone.
  await Promise.all(
    deleted
      .filter((row): row is { photoUrl: string } => typeof row.photoUrl === "string")
      .map((row) =>
        unlink(path.join(UPLOADS_DIR, path.basename(row.photoUrl))).catch(() => {})
      )
  );

  if (deleted.length > 0) {
    await logAudit(user.id, AUDIT_ACTIONS.EXPENSES_DELETED_ALL, `${deleted.length} expenses`);
  }

  return NextResponse.json({ deleted: deleted.length });
}
