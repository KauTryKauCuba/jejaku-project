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
          the dashboard (there it's 1 of 4 columns inside a 5-of-6 content
          area, i.e. 5/24 of the page) while "All Receipts" fills the rest
          of the actual page edge-to-edge — there's no calendar column here
          reserving that 6th slice like there is on the dashboard.
        */}
        <div className="mt-[19px] grid gap-[19px] lg:grid-cols-[repeat(24,minmax(0,1fr))]">
          <div className="lg:[grid-column:span_5/span_5]">
            <ReceiptScannerCard />
          </div>
          <div className="lg:[grid-column:span_19/span_19]">
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
