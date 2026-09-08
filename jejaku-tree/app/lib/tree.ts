import { eq } from "drizzle-orm";
import { db } from "../db";
import { trees, treeMembers } from "../db/schema";

// v1 only ever shows the tree an account owns — this is the single place
// that assumption lives, so a future "pick which tree" UI only has to
// change this one lookup, not every route that currently calls it.
//
// Also inserts a `tree_members` row for the owner (role "owner") even
// though nothing reads tree_members yet in v1 — see the comment on that
// table in db/schema.ts for why this is written now instead of backfilled
// later.
export async function getOrCreateTree(userId: string, ownerFullName: string) {
  const existing = await db.query.trees.findFirst({ where: eq(trees.ownerUserId, userId) });
  if (existing) return existing;

  const [created] = await db
    .insert(trees)
    .values({ ownerUserId: userId, name: `${ownerFullName}'s family tree` })
    .returning();

  await db.insert(treeMembers).values({ treeId: created.id, userId, role: "owner" }).onConflictDoNothing();

  return created;
}
