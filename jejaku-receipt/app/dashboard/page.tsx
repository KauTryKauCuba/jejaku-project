import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import { db } from "../db";
import { expenses } from "../db/schema";
import { toExpense } from "../db/toExpense";
import { ensureDemoSeed } from "../lib/demoData";
import { ExpensesProvider } from "../components/ExpensesProvider";
import DashboardGreeting from "../components/DashboardGreeting";
import DashboardShell from "../components/DashboardShell";
import ReceiptScannerCard from "../components/ReceiptScannerCard";
import DashboardCalendar from "../components/DashboardCalendar";
import TotalSpentTile from "../components/TotalSpentTile";
import ReceiptsScannedTile from "../components/ReceiptsScannedTile";
import CategoriesTrackedTile from "../components/CategoriesTrackedTile";
import MonthlyTrendTile from "../components/MonthlyTrendTile";
import RecentReceipts from "../components/RecentReceipts";
import WhyScanCard from "../components/WhyScanCard";
import BenefitsCard from "../components/BenefitsCard";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku Receipt",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

  await ensureDemoSeed(user);

  const rows = await db.query.expenses.findMany({
    where: eq(expenses.userId, user.id),
    orderBy: desc(expenses.createdAt),
  });
  const initialExpenses = rows.map(toExpense);

  return (
    <ExpensesProvider
      initialExpenses={initialExpenses}
      defaultCurrency={user.defaultCurrency}
      initialCustomCategories={user.customCategories}
    >
      <DashboardShell>
        <DashboardGreeting />
        <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
          Welcome to Jejaku Receipt
        </h2>
        <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
          Scan a receipt and we&apos;ll pull out the details.
        </p>

        <div className="mt-[19px] grid items-start gap-[19px] lg:grid-cols-6">
          <div className="min-w-0 lg:col-span-5">
            <div className="grid gap-[19px] sm:grid-cols-2 lg:grid-cols-4">
              <ReceiptScannerCard />
              <div className="flex min-w-0 flex-col gap-[19px]">
                <div className="flex-1">
                  <TotalSpentTile />
                </div>
                <div className="flex-1">
                  <ReceiptsScannedTile />
                </div>
              </div>
              <CategoriesTrackedTile />
              <MonthlyTrendTile />
            </div>

            <div className="mt-[19px]">
              <RecentReceipts />
            </div>

            <div className="mt-[19px] grid gap-[19px] lg:grid-cols-2">
              <WhyScanCard />
              <BenefitsCard />
            </div>
          </div>

          <DashboardCalendar />
        </div>
      </DashboardShell>
    </ExpensesProvider>
  );
}
