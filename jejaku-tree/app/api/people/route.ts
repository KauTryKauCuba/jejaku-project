import { NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/currentUser";
import { getOrCreateTree } from "../../lib/tree";
import { db } from "../../db";
import { people } from "../../db/schema";
import { toPerson } from "../../db/toPerson";
import { validatePersonInput } from "../../lib/people";
import { withApiErrorHandling } from "../../lib/apiError";

// Only used to create the very first card in an empty tree — every card
// after that is created via /api/people/[id]/relatives, which also links
// it into the graph. A bare, unlinked person created here would be
// unreachable from the focus view (nothing points to it), so this route
// intentionally refuses once the tree already has anyone in it.
export const POST = withApiErrorHandling("POST /api/people", async (request: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tree = await getOrCreateTree(user.id, user.fullName);

  const existing = await db.query.people.findFirst({ where: (p, { eq }) => eq(p.treeId, tree.id) });
  if (existing) {
    return NextResponse.json({ error: "This tree already has people in it — add relatives from a card instead." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  if (!validatePersonInput(body)) {
    return NextResponse.json({ error: "Invalid person data." }, { status: 400 });
  }

  const [created] = await db
    .insert(people)
    .values({
      treeId: tree.id,
      givenName: body.givenName.trim(),
      familyName: body.familyName?.trim() || null,
      sex: body.sex,
      birthDate: body.birthDate?.trim() || null,
      birthDatePrecision: body.birthDate?.trim() ? body.birthDatePrecision ?? "year" : null,
      isDeceased: body.isDeceased ?? false,
      deathDate: body.deathDate?.trim() || null,
      deathDatePrecision: body.deathDate?.trim() ? body.deathDatePrecision ?? "year" : null,
      birthPlace: body.birthPlace?.trim() || null,
      occupation: body.occupation?.trim() || null,
      note: body.note?.trim() || null,
    })
    .returning();

  return NextResponse.json(toPerson(created));
});
