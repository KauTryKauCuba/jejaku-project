import { and, eq, or } from "drizzle-orm";
import { db } from "../db";
import { people, families, familyChildren } from "../db/schema";
import type { PersonInput } from "./people";

// The four "+" actions on a focus-view card. Each one creates exactly one
// new person plus at most one new `families` row — see the design note on
// `families` in db/schema.ts for why a union table makes every one of
// these a single, obvious operation instead of a pointer-patching dance.
//
// Every action here always creates a brand-new person. There is no "link
// an existing person as your father" flow yet (that would need a cycle
// guard walking the ancestor chain before inserting) — out of scope for
// v1, noted here so it isn't mistaken for an oversight.

export class RelativeActionError extends Error {
  constructor(
    message: string,
    public readonly code: "NEEDS_FAMILY_CHOICE" | "ALREADY_HAS_TWO_PARENTS" | "NOT_FOUND",
    public readonly families?: { id: string; otherPartnerName: string | null }[]
  ) {
    super(message);
  }
}

async function insertPerson(treeId: string, input: PersonInput) {
  const [created] = await db
    .insert(people)
    .values({
      treeId,
      givenName: input.givenName.trim(),
      familyName: input.familyName?.trim() || null,
      sex: input.sex,
      birthDate: input.birthDate?.trim() || null,
      birthDatePrecision: input.birthDate?.trim() ? input.birthDatePrecision ?? "year" : null,
      isDeceased: input.isDeceased ?? false,
      deathDate: input.deathDate?.trim() || null,
      deathDatePrecision: input.deathDate?.trim() ? input.deathDatePrecision ?? "year" : null,
      birthPlace: input.birthPlace?.trim() || null,
      occupation: input.occupation?.trim() || null,
      note: input.note?.trim() || null,
    })
    .returning();
  return created;
}

// The family this person is a *child* in, if any — v1 constrains a person
// to at most one such family (their birth family, see db/schema.ts's
// comment on family_children), so "the" is safe here.
async function findChildFamily(treeId: string, personId: string) {
  // Two queries rather than a `with` join — this codebase doesn't define
  // drizzle `relations()` anywhere (see the other apps' schema.ts), so
  // the relational query API's `with` isn't wired up; matching that
  // existing pattern instead of introducing a one-off relations config.
  const link = await db.query.familyChildren.findFirst({ where: eq(familyChildren.childId, personId) });
  if (!link) return null;
  const family = await db.query.families.findFirst({ where: eq(families.id, link.familyId) });
  if (!family || family.treeId !== treeId) return null;
  return family;
}

// Every family this person is a *partner* in.
async function findPartnerFamilies(treeId: string, personId: string) {
  return db.query.families.findMany({
    where: and(eq(families.treeId, treeId), or(eq(families.partnerAId, personId), eq(families.partnerBId, personId))),
  });
}

// Add father/mother. Reuses the existing child-family row when there is
// one (so a second parent slots into the same union the first parent —
// or an existing sibling's parent — already occupies) instead of ever
// creating two separate single-parent families for the same person.
export async function addParent(treeId: string, personId: string, input: PersonInput) {
  const existingFamily = await findChildFamily(treeId, personId);

  if (!existingFamily) {
    const parent = await insertPerson(treeId, input);
    const [family] = await db.insert(families).values({ treeId, partnerAId: parent.id }).returning();
    // Links the *anchor* (personId) as a child of this brand-new family —
    // not the new parent. The client only learns the graph changed via
    // whatever family_children rows this function returns, so this one
    // has to be reported back just like the new parent/family are, or
    // the anchor's own client-side state never learns it now has a
    // parent (a bug caught by actually running this in a browser: the
    // parent card was created and returned by the API, but silently
    // never appeared, because the client had no idea the link existed).
    const [link] = await db.insert(familyChildren).values({ familyId: family.id, childId: personId }).returning();
    return { person: parent, family, newFamilyChildren: [link] };
  }

  if (existingFamily.partnerAId && existingFamily.partnerBId) {
    throw new RelativeActionError("This person already has two parents.", "ALREADY_HAS_TWO_PARENTS");
  }

  const parent = await insertPerson(treeId, input);
  const [family] = existingFamily.partnerAId
    ? await db.update(families).set({ partnerBId: parent.id }).where(eq(families.id, existingFamily.id)).returning()
    : await db.update(families).set({ partnerAId: parent.id }).where(eq(families.id, existingFamily.id)).returning();
  // Reusing an existing family — the anchor's family_children link
  // already existed before this call, so there's nothing new to report.
  return { person: parent, family, newFamilyChildren: [] };
}

// Add wife/husband/partner. Fills an existing family's empty slot if this
// person is already in one with room, otherwise starts a new union — so a
// remarriage becomes a second `families` row rather than overwriting the
// first.
export async function addPartner(treeId: string, personId: string, input: PersonInput) {
  const partnerFamilies = await findPartnerFamilies(treeId, personId);
  const openFamily = partnerFamilies.find((f) => !f.partnerAId || !f.partnerBId);

  const newPartner = await insertPerson(treeId, input);

  if (openFamily) {
    const isA = openFamily.partnerAId === personId;
    const [family] = isA
      ? await db.update(families).set({ partnerBId: newPartner.id }).where(eq(families.id, openFamily.id)).returning()
      : await db.update(families).set({ partnerAId: newPartner.id }).where(eq(families.id, openFamily.id)).returning();
    return { person: newPartner, family, newFamilyChildren: [] };
  }

  const [family] = await db
    .insert(families)
    .values({ treeId, partnerAId: personId, partnerBId: newPartner.id })
    .returning();
  // A partnership never touches family_children — nobody becomes anyone's
  // child here.
  return { person: newPartner, family, newFamilyChildren: [] };
}

// Add son/daughter. When this person is a partner in more than one
// family (remarried), the caller must say which union the child belongs
// to — surfaced back to the API route as NEEDS_FAMILY_CHOICE so it can
// ask "with which partner?" instead of guessing.
export async function addChild(treeId: string, personId: string, input: PersonInput, familyId?: string) {
  const partnerFamilies = await findPartnerFamilies(treeId, personId);

  let targetFamily = partnerFamilies.length === 1 ? partnerFamilies[0] : null;

  if (familyId) {
    targetFamily = partnerFamilies.find((f) => f.id === familyId) ?? null;
    if (!targetFamily) throw new RelativeActionError("That family wasn't found.", "NOT_FOUND");
  }

  if (!targetFamily && partnerFamilies.length > 1) {
    const withNames = await Promise.all(
      partnerFamilies.map(async (f) => {
        const otherId = f.partnerAId === personId ? f.partnerBId : f.partnerAId;
        const other = otherId ? await db.query.people.findFirst({ where: eq(people.id, otherId) }) : null;
        return { id: f.id, otherPartnerName: other ? `${other.givenName} ${other.familyName ?? ""}`.trim() : null };
      })
    );
    throw new RelativeActionError("This person has more than one partner — pick which family this child belongs to.", "NEEDS_FAMILY_CHOICE", withNames);
  }

  if (!targetFamily) {
    const [created] = await db.insert(families).values({ treeId, partnerAId: personId }).returning();
    targetFamily = created;
  }

  const child = await insertPerson(treeId, input);
  const [link] = await db.insert(familyChildren).values({ familyId: targetFamily.id, childId: child.id }).returning();
  return { person: child, family: targetFamily, newFamilyChildren: [link] };
}

// Add brother/sister. Reuses the family this person is already a child
// in; if they have no parents recorded yet, creates a family with both
// parent slots empty so the sibling relationship exists even before
// anyone is entered as the parent — and when a parent is added later
// (addParent, above), it slots into this same family and becomes the
// sibling's parent too, automatically.
export async function addSibling(treeId: string, personId: string, input: PersonInput) {
  let family = await findChildFamily(treeId, personId);
  // Only set when this call had to create the anchor's own family_children
  // link (they had no parents recorded yet) — the same "the anchor's own
  // link changed too, not just the new person's" case as addParent above.
  let anchorLink: typeof familyChildren.$inferSelect | null = null;

  if (!family) {
    const [created] = await db.insert(families).values({ treeId }).returning();
    [anchorLink] = await db.insert(familyChildren).values({ familyId: created.id, childId: personId }).returning();
    family = created;
  }

  const sibling = await insertPerson(treeId, input);
  const [siblingLink] = await db.insert(familyChildren).values({ familyId: family.id, childId: sibling.id }).returning();
  return { person: sibling, family, newFamilyChildren: anchorLink ? [anchorLink, siblingLink] : [siblingLink] };
}
