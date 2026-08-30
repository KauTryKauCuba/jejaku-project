import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import { db } from "../db";
import { expenses } from "../db/schema";
import type { Expense } from "../lib/expenses";
import { ExpensesProvider } from "../components/ExpensesProvider";
import DashboardGreeting from "../components/DashboardGreeting";
import DashboardShell from "../components/DashboardShell";
import AddExpenseCard from "../components/AddExpenseCard";
import DashboardCalendar from "../components/DashboardCalendar";
import TotalSpentTile from "../components/TotalSpentTile";
import ReceiptsScannedTile from "../components/ReceiptsScannedTile";
import CategoriesTrackedTile from "../components/CategoriesTrackedTile";
import MonthlyTrendTile from "../components/MonthlyTrendTile";
import RecentReceipts from "../components/RecentReceipts";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku Receipt",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

  const rows = await db.query.expenses.findMany({
    where: eq(expenses.userId, user.id),
    orderBy: desc(expenses.createdAt),
  });
  const initialExpenses: Expense[] = rows.map((row) => ({
    id: row.id,
    merchant: row.merchant,
    amount: row.amount,
    date: row.date,
    category: row.category as Expense["category"],
    note: row.note ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <ExpensesProvider initialExpenses={initialExpenses}>
      <DashboardShell>
        <DashboardGreeting />
        <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
          Welcome to Jejaku Receipt
        </h2>
        <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
          Scan a receipt or log an expense manually.
        </p>

        <div className="mt-[19px] grid items-start gap-[19px] lg:grid-cols-5">
          <DashboardCalendar />
          <AddExpenseCard />
          <TotalSpentTile />
          <ReceiptsScannedTile />
          <MonthlyTrendTile />
        </div>

        <div className="mt-[19px] grid gap-[19px] lg:grid-cols-2">
          <CategoriesTrackedTile />
          <RecentReceipts />
        </div>
      </DashboardShell>
    </ExpensesProvider>
  );
}
