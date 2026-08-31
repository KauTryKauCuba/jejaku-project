import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { convertCurrency } from "../../../lib/exchangeRates";
import { db } from "../../../db";
import { expenses } from "../../../db/schema";
import { toExpense } from "../../../db/toExpense";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, type ExpenseItem } from "../../../lib/expenses";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await db.query.expenses.findFirst({
    where: and(eq(expenses.id, id), eq(expenses.userId, user.id)),
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
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
  const noteRaw = form.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  const locationRaw = form.get("location");
  const location = typeof locationRaw === "string" ? locationRaw.trim() : "";
  const currencyRaw = form.get("currency");
  const currency =
    typeof currencyRaw === "string" && CURRENCY_CODE_PATTERN.test(currencyRaw.toUpperCase())
      ? currencyRaw.toUpperCase()
      : "";

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

  // Re-snapshot the home-currency conversion since amount/currency may have
  // changed — see the POST route and the schema comment for why this is a
  // save-time snapshot rather than computed live.
  const expenseCurrency = currency || DEFAULT_CURRENCY;
  const homeCurrencyAmount = await convertCurrency(amount, expenseCurrency, user.defaultCurrency);
  if (homeCurrencyAmount === null) {
    console.error("[expenses] currency conversion failed on edit", expenseCurrency, "->", user.defaultCurrency);
  }

  const [row] = await db
    .update(expenses)
    .set({
      merchant,
      amount,
      date,
      category,
      tax,
      note: note || null,
      location: location || null,
      currency: currency || null,
      homeCurrencyAmount,
      homeCurrencyCode: homeCurrencyAmount === null ? null : user.defaultCurrency,
      items: items && items.length > 0 ? items : null,
    })
    .where(eq(expenses.id, id))
    .returning();

  return NextResponse.json(toExpense(row));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
    .returning({ id: expenses.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
