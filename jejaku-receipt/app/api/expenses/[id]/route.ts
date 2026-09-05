import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { convertCurrency } from "../../../lib/exchangeRates";
import { lookupCoordinates } from "../../../lib/cityCoordinates";
import { db } from "../../../db";
import { expenses } from "../../../db/schema";
import { toExpense } from "../../../db/toExpense";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, formatCurrency, parseItems, parseSplit } from "../../../lib/expenses";
import { AUDIT_ACTIONS, logAudit } from "../../../lib/auditLog";
import { withApiErrorHandling } from "../../../lib/apiError";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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
  const isWarrantyClaim = form.get("isWarrantyClaim") === "true";
  const noteRaw = form.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  const cityRaw = form.get("city");
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";
  const stateRaw = form.get("state");
  const state = typeof stateRaw === "string" ? stateRaw.trim() : "";
  const countryRaw = form.get("country");
  const country = typeof countryRaw === "string" ? countryRaw.trim() : "";
  const coords = lookupCoordinates(city, state, country);
  const currencyRaw = form.get("currency");
  const currency =
    typeof currencyRaw === "string" && CURRENCY_CODE_PATTERN.test(currencyRaw.toUpperCase())
      ? currencyRaw.toUpperCase()
      : "";

  const items = parseItems(form.get("items"));

  const split = parseSplit(form.get("split"));

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
      isWarrantyClaim,
      note: note || null,
      city: city || null,
      state: state || null,
      country: country || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      currency: currency || null,
      homeCurrencyAmount,
      homeCurrencyCode: homeCurrencyAmount === null ? null : user.defaultCurrency,
      items: items && items.length > 0 ? items : null,
      split,
    })
    .where(eq(expenses.id, id))
    .returning();

  await logAudit(
    user.id,
    AUDIT_ACTIONS.EXPENSE_UPDATED,
    `${merchant} — ${formatCurrency(amount, currency || DEFAULT_CURRENCY)}`
  );

  return NextResponse.json(toExpense(row));
});

export const DELETE = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
    .returning({ id: expenses.id, merchant: expenses.merchant, amount: expenses.amount, currency: expenses.currency });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const [row] = deleted;
  await logAudit(
    user.id,
    AUDIT_ACTIONS.EXPENSE_DELETED,
    `${row.merchant} — ${formatCurrency(row.amount, row.currency ?? DEFAULT_CURRENCY)}`
  );

  return NextResponse.json({ ok: true });
});
