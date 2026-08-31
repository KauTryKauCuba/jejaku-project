import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { getExchangeRate } from "../../../lib/exchangeRates";
import { db } from "../../../db";
import { expenses, users } from "../../../db/schema";
import { DEFAULT_CURRENCY } from "../../../lib/expenses";

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

// This endpoint is called cross-origin from jejaku's own /settings page —
// the currency setting is edited there, but the data (and the expenses it
// re-converts) lives in this app's database. The shared session cookie
// (domain .jejaku.my) already authenticates the request; this only adds
// the CORS headers needed for a browser to let that credentialed fetch
// through. Scoped to jejaku's exact origin, not a wildcard, since
// wildcard + credentials is rejected by browsers anyway.
const ALLOWED_ORIGIN = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: corsHeaders() });
  }
  return NextResponse.json({ currency: user.defaultCurrency }, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: corsHeaders() });
  }

  const { currency } = await request.json();
  if (typeof currency !== "string" || !CURRENCY_CODE_PATTERN.test(currency.toUpperCase())) {
    return NextResponse.json(
      { error: "Enter a valid 3-letter currency code." },
      { status: 400, headers: corsHeaders() }
    );
  }
  const newCurrency = currency.toUpperCase();

  await db.update(users).set({ defaultCurrency: newCurrency }).where(eq(users.id, user.id));

  // Re-snapshot every existing expense into the new home currency so
  // aggregate totals stay consistent — otherwise old rows would keep their
  // homeCurrencyAmount in the *previous* home currency and summing them
  // with new ones would silently reproduce the mixed-currency bug.
  const userExpenses = await db.query.expenses.findMany({
    where: eq(expenses.userId, user.id),
  });

  const distinctCurrencies = [...new Set(userExpenses.map((e) => e.currency ?? DEFAULT_CURRENCY))];
  const rateByCurrency = new Map<string, number | null>();
  await Promise.all(
    distinctCurrencies.map(async (code) => {
      rateByCurrency.set(code, await getExchangeRate(code, newCurrency));
    })
  );

  let failedCount = 0;
  await Promise.all(
    userExpenses.map(async (expense) => {
      const originalCurrency = expense.currency ?? DEFAULT_CURRENCY;
      const rate = rateByCurrency.get(originalCurrency) ?? null;
      if (rate === null) {
        failedCount += 1;
        return db
          .update(expenses)
          .set({ homeCurrencyAmount: null, homeCurrencyCode: null })
          .where(eq(expenses.id, expense.id));
      }
      return db
        .update(expenses)
        .set({ homeCurrencyAmount: expense.amount * rate, homeCurrencyCode: newCurrency })
        .where(eq(expenses.id, expense.id));
    })
  );

  return NextResponse.json(
    {
      currency: newCurrency,
      reconverted: userExpenses.length - failedCount,
      failed: failedCount,
    },
    { headers: corsHeaders() }
  );
}
