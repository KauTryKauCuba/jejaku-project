import type { expenses } from "./schema";
import type { Expense } from "../lib/expenses";

export function toExpense(row: typeof expenses.$inferSelect): Expense {
  return {
    id: row.id,
    merchant: row.merchant,
    amount: row.amount,
    date: row.date,
    category: row.category as Expense["category"],
    tax: row.tax ?? undefined,
    isDemo: row.isDemo,
    isWarrantyClaim: row.isWarrantyClaim,
    warrantyMonths: row.warrantyMonths ?? undefined,
    note: row.note ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    location: row.location ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    country: row.country ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    currency: row.currency ?? undefined,
    homeCurrencyAmount: row.homeCurrencyAmount ?? undefined,
    homeCurrencyCode: row.homeCurrencyCode ?? undefined,
    items: row.items ?? undefined,
    split: row.split ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
