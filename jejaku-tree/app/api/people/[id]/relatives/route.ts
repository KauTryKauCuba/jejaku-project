import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/currentUser";
import { getOrCreateTree } from "../../../../lib/tree";
import { db } from "../../../../db";
import { people } from "../../../../db/schema";
import { toPerson, toFamily, toFamilyChild } from "../../../../db/toPerson";
import { validatePersonInput } from "../../../../lib/people";
import { addChild, addParent, addPartner, addSibling, RelativeActionError } from "../../../../lib/relatives";
import { withApiErrorHandling } from "../../../../lib/apiError";

const RELATIONS = ["parent", "partner", "child", "sibling"] as const;
type Relation = (typeof RELATIONS)[number];

// The single endpoint behind every "+" on a focus-view card. `relation`
// picks which of the four lib/relatives.ts operations runs; `familyId` is
// only meaningful (and only ever needed) for relation:"child" when the
// person already has more than one partner — see addChild's
// NEEDS_FAMILY_CHOICE case below.
export const POST = withApiErrorHandling("POST /api/people/[id]/relatives", async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tree = await getOrCreateTree(user.id, user.fullName);

  const anchor = await db.query.people.findFirst({ where: eq(people.id, id) });
  if (!anchor || anchor.treeId !== tree.id) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { relation, familyId, person: personInput } = body as { relation?: string; familyId?: string; person?: unknown };

  if (!relation || !(RELATIONS as readonly string[]).includes(relation)) {
    return NextResponse.json({ error: "Invalid relation type." }, { status: 400 });
  }
  if (!validatePersonInput(personInput)) {
    return NextResponse.json({ error: "Invalid person data." }, { status: 400 });
  }

  try {
    const result = await (async () => {
      switch (relation as Relation) {
        case "parent":
          return addParent(tree.id, anchor.id, personInput);
        case "partner":
          return addPartner(tree.id, anchor.id, personInput);
        case "child":
          return addChild(tree.id, anchor.id, personInput, familyId);
        case "sibling":
          return addSibling(tree.id, anchor.id, personInput);
      }
    })();

    return NextResponse.json({
      person: toPerson(result.person),
      family: toFamily(result.family),
      newFamilyChildren: result.newFamilyChildren.map(toFamilyChild),
    });
  } catch (err) {
    if (err instanceof RelativeActionError) {
      return NextResponse.json({ error: err.message, code: err.code, families: err.families }, { status: 409 });
    }
    throw err;
  }
});
