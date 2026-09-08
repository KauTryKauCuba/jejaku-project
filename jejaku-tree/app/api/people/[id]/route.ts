import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/currentUser";
import { getOrCreateTree } from "../../../lib/tree";
import { db } from "../../../db";
import { people } from "../../../db/schema";
import { toPerson } from "../../../db/toPerson";
import { validatePersonInput } from "../../../lib/people";
import { withApiErrorHandling } from "../../../lib/apiError";

export const PATCH = withApiErrorHandling("PATCH /api/people/[id]", async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tree = await getOrCreateTree(user.id, user.fullName);

  const existing = await db.query.people.findFirst({ where: eq(people.id, id) });
  if (!existing || existing.treeId !== tree.id) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!validatePersonInput(body)) {
    return NextResponse.json({ error: "Invalid person data." }, { status: 400 });
  }

  const [updated] = await db
    .update(people)
    .set({
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
    .where(eq(people.id, id))
    .returning();

  return NextResponse.json(toPerson(updated));
});

// Deleting a person leaves the families/family_children rows around them
// intact — `families.partnerAId`/`partnerBId` are `set null` on delete
// (see db/schema.ts) so a union survives losing one partner, and
// `family_children` cascades only the one link row, not the family
// itself. Siblings and the other parent are unaffected.
export const DELETE = withApiErrorHandling("DELETE /api/people/[id]", async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tree = await getOrCreateTree(user.id, user.fullName);

  const existing = await db.query.people.findFirst({ where: eq(people.id, id) });
  if (!existing || existing.treeId !== tree.id) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  await db.delete(people).where(eq(people.id, id));

  return NextResponse.json({ ok: true });
});
