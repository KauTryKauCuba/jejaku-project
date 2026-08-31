import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { expenses, users } from "../db/schema";
import { convertCurrency } from "./exchangeRates";
import { DEMO_EXPENSES } from "./demoExpenses";

export { DEMO_EXPENSES };

// Inserts DEMO_EXPENSES for the given user. Caller is responsible for
// checking whether the user already has expenses first, if "don't
// duplicate" matters for that call site.
export async function seedDemoExpenses(userId: string, homeCurrency: string) {
  for (const d of DEMO_EXPENSES) {
    const homeCurrencyAmount = await convertCurrency(d.amount, d.currency, homeCurrency);
    await db.insert(expenses).values({
      userId,
      merchant: d.merchant,
      amount: d.amount,
      date: d.date,
      category: d.category,
      tax: d.tax ?? null,
      isDemo: true,
      note: d.note ?? null,
      location: d.location ?? null,
      currency: d.currency,
      homeCurrencyAmount,
      homeCurrencyCode: homeCurrencyAmount === null ? null : homeCurrency,
      items: d.items ?? null,
    });
  }
  return DEMO_EXPENSES.length;
}

// Seeds demo data exactly once per account, on whichever request first
// notices demoSeededAt is still null (in practice, the first dashboard
// load after signup). The update-then-check-rowcount pattern makes the
// "claim" atomic — if two requests race, only one gets a non-empty
// result back and actually seeds, so concurrent tabs can't double-seed.
export async function ensureDemoSeed(user: { id: string; demoSeededAt: Date | null; defaultCurrency: string }) {
  if (user.demoSeededAt) return;

  const claimed = await db
    .update(users)
    .set({ demoSeededAt: new Date() })
    .where(and(eq(users.id, user.id), isNull(users.demoSeededAt)))
    .returning({ id: users.id });

  if (claimed.length > 0) {
    await seedDemoExpenses(user.id, user.defaultCurrency);
  }
}
