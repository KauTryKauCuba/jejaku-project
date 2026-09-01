import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { jejakuUrl } from "../lib/jejakuUrl";
import { db } from "../db";
import { expenses, users, auditLogs } from "../db/schema";
import DashboardShell from "../components/DashboardShell";
import MemberCard from "../components/MemberCard";
import DemoDataCard from "../components/DemoDataCard";
import DangerZoneCard from "../components/DangerZoneCard";
import AuditTrailCard from "../components/AuditTrailCard";

export const metadata: Metadata = {
  title: "Settings — Jejaku Receipt",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.otpConfirmed || !session.dbProfile) {
    redirect(jejakuUrl("/login"));
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.dbProfile.email),
  });
  const userExpenses = user
    ? await db.query.expenses.findMany({ where: eq(expenses.userId, user.id) })
    : [];
  const expenseCount = userExpenses.length;
  const demoCount = userExpenses.filter((e) => e.isDemo).length;

  const auditLogRows = user
    ? await db.query.auditLogs.findMany({
        where: eq(auditLogs.userId, user.id),
        orderBy: desc(auditLogs.createdAt),
        // A running log grows forever — cap what a single Settings visit
        // fetches rather than pulling every row an active account has
        // ever produced.
        limit: 500,
      })
    : [];
  const auditLogEntries = auditLogRows.map((row) => ({
    id: row.id,
    action: row.action,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <DashboardShell>
      <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
        Settings
      </h2>
      <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Your profile and preferences are managed on Jejaku — edit your name, photo, and
        default currency there.
      </p>

      <div className="mt-[19px] grid gap-[19px] md:grid-cols-[280px_1fr]">
        <div style={{ perspective: 1000 }}>
          <MemberCard profile={session.dbProfile} />
        </div>

        <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
          <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
            Edit profile & currency
          </h3>
          <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
            Your name, photo, and default currency (used for Total Spent and Monthly Trend
            here) are all managed on Jejaku and shared here automatically.
          </p>
          <a
            href={jejakuUrl("/settings")}
            className="mt-[15px] flex h-[37px] w-fit items-center justify-center rounded-pill bg-primary px-[19px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            Manage on Jejaku
          </a>
        </div>
      </div>

      <div className="mt-[19px] grid gap-[19px] md:grid-cols-2">
        <DemoDataCard demoCount={demoCount} />
        <DangerZoneCard expenseCount={expenseCount} />
      </div>

      <div className="mt-[19px]">
        <AuditTrailCard initialLogs={auditLogEntries} />
      </div>
    </DashboardShell>
  );
}
