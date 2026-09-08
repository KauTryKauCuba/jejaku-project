import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Tree, Users } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import { getOrCreateTree } from "../lib/tree";
import { db } from "../db";
import { people } from "../db/schema";
import { birthYear } from "../lib/people";
import DashboardShell from "../components/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku Tree",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

  const tree = await getOrCreateTree(user.id, user.fullName);
  const peopleRows = await db.query.people.findMany({ where: eq(people.treeId, tree.id) });
  const oldestYear = peopleRows.map(birthYear).filter((y): y is number => y !== null).sort((a, b) => a - b)[0];

  return (
    <DashboardShell>
      <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">Welcome to Jejaku Tree</h2>
      <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">{tree.name}</p>

      <div className="mt-[19px] grid gap-[19px] sm:grid-cols-2">
        <div className="flex flex-col gap-[4px] rounded-lg border border-hairline bg-canvas p-[16px]">
          <span className="flex items-center gap-[6px] text-[11px] uppercase tracking-[0.5px] text-ink-mute">
            <Users size={13} weight="light" />
            People
          </span>
          <p className="tabular text-[24px] font-light text-ink">{peopleRows.length}</p>
        </div>
        <div className="flex flex-col gap-[4px] rounded-lg border border-hairline bg-canvas p-[16px]">
          <span className="text-[11px] uppercase tracking-[0.5px] text-ink-mute">Earliest birth year on record</span>
          <p className="tabular text-[24px] font-light text-ink">{oldestYear ?? "—"}</p>
        </div>
      </div>

      <Link
        href="/tree"
        className="mt-[19px] flex min-h-[180px] flex-col items-center justify-center gap-[8px] rounded-lg border border-dashed border-hairline-input bg-canvas p-[24px] text-center transition-colors hover:border-primary hover:bg-canvas-soft"
      >
        <Tree size={22} weight="light" className="text-primary-soft" />
        <p className="text-[14px] font-medium text-ink">{peopleRows.length > 0 ? "Open your family tree" : "Start your family tree"}</p>
        <p className="max-w-sm text-[12px] leading-relaxed text-ink-mute">
          {peopleRows.length > 0
            ? "Add parents, partners, children, and siblings — one relative at a time."
            : "Add the first person, then build outward from them."}
        </p>
      </Link>
    </DashboardShell>
  );
}
