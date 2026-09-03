import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import { db } from "../db";
import { expenses } from "../db/schema";
import { toExpense } from "../db/toExpense";
import { ExpensesProvider } from "../components/ExpensesProvider";
import DashboardShell from "../components/DashboardShell";
import ReceiptsList from "../components/ReceiptsList";
import ReceiptScannerCard from "../components/ReceiptScannerCard";

export const metadata: Metadata = {
  title: "Receipts — Jejaku Receipt",
};

export default async function ReceiptsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

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
        <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
          Receipts
        </h2>
        <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
          Every expense you&apos;ve logged, in one place.
        </p>

        {/*
          24 columns so the scanner card lands at the same width it has on
          the dashboard (there it's 1 of 3 columns inside a col-span-3-of-4
          content area, i.e. 3/4 × 1/3 = 1/4 of the page = 6/24) while "All
          Receipts" fills the rest of the actual page edge-to-edge — there's
          no calendar column here reserving a slice like there is on the
          dashboard.
        */}
        <div className="mt-[19px] grid gap-[19px] lg:grid-cols-[repeat(24,minmax(0,1fr))]">
          <div className="min-w-0 lg:[grid-column:span_6/span_6]">
            <ReceiptScannerCard />
          </div>
          <div className="min-w-0 lg:[grid-column:span_18/span_18]">
            <ReceiptsList
              title="All Receipts"
              description="Browse and page through everything you've scanned or entered."
              defaultPageSize="10"
              editable
            />
          </div>
        </div>
      </DashboardShell>
    </ExpensesProvider>
  );
}
