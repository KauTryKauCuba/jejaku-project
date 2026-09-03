"use client";

import { ExpensesProvider } from "../components/ExpensesProvider";
import MonthlyTrendTile from "../components/MonthlyTrendTile";
import { DEMO_EXPENSES } from "../lib/demoExpenses";
import type { Expense } from "../lib/expenses";

const initialExpenses: Expense[] = DEMO_EXPENSES.map((d, i) => ({
  id: String(i),
  merchant: d.merchant,
  amount: d.amount,
  date: d.date,
  category: d.category,
  tax: d.tax,
  note: d.note,
  city: d.city,
  state: d.state,
  country: d.country,
  currency: d.currency,
  homeCurrencyAmount: d.amount,
  homeCurrencyCode: d.currency,
  items: d.items,
  createdAt: d.date,
}));

export default function DevPreviewPage() {
  return (
    <ExpensesProvider initialExpenses={initialExpenses}>
      <div className="min-h-screen bg-canvas-soft p-[24px]">
        <div className="mx-auto max-w-[420px]">
          <MonthlyTrendTile />
        </div>
      </div>
    </ExpensesProvider>
  );
}
