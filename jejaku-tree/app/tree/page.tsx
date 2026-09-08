import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import { getOrCreateTree } from "../lib/tree";
import { db } from "../db";
import { people, families, familyChildren } from "../db/schema";
import { toPerson, toFamily, toFamilyChild } from "../db/toPerson";
import DashboardShell from "../components/DashboardShell";
import { PeopleProvider } from "../components/PeopleProvider";
import TreeFocusView from "../components/TreeFocusView";
import StartTreeCard from "../components/StartTreeCard";
import TreePeopleCount from "../components/TreePeopleCount";

export const metadata: Metadata = {
  title: "Family Tree — Jejaku Tree",
};

export default async function TreePage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

  const tree = await getOrCreateTree(user.id, user.fullName);

  const [peopleRowsRaw, familyRowsRaw] = await Promise.all([
    db.query.people.findMany({ where: eq(people.treeId, tree.id) }),
    db.query.families.findMany({ where: eq(families.treeId, tree.id) }),
  ]);
  const familyIds = familyRowsRaw.map((f) => f.id);
  const familyChildRowsRaw = familyIds.length
    ? await db.query.familyChildren.findMany({ where: inArray(familyChildren.familyId, familyIds) })
    : [];

  const peopleRows = peopleRowsRaw.map(toPerson);
  const familyRows = familyRowsRaw.map(toFamily);
  const familyChildRows = familyChildRowsRaw.map(toFamilyChild);

  const { focus } = await searchParams;
  // Prefer the person this account has claimed (once claiming exists), then
  // whatever focus id the URL asks for, then just the first person on the
  // tree — always something reasonable to land on, never a blank page.
  const claimedByMe = peopleRows.find((p) => p.claimedByUserId === user.id);
  const focusId = (focus && peopleRows.some((p) => p.id === focus) ? focus : undefined) ?? claimedByMe?.id ?? peopleRows[0]?.id;

  return (
    <DashboardShell>
      <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">{tree.name}</h2>

      <PeopleProvider initialPeople={peopleRows} initialFamilies={familyRows} initialFamilyChildren={familyChildRows}>
        <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
          <TreePeopleCount />
        </p>

        <div className="mt-[19px]">{focusId ? <TreeFocusView focusId={focusId} /> : <StartTreeCard />}</div>
      </PeopleProvider>
    </DashboardShell>
  );
}
