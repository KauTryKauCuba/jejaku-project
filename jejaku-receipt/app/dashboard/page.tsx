import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { jejakuUrl } from "../lib/jejakuUrl";
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
  const session = await auth();
  if (!session?.otpConfirmed || !session.dbProfile) {
    redirect(jejakuUrl("/login"));
  }

  return (
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
  );
}
