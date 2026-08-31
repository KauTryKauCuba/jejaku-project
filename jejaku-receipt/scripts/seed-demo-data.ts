// One-time demo-data seed — inserts the same sample receipts used in local
// development (spread across March-August) against the first user found.
// Guarded to be a no-op if that user already has expenses, so re-running
// this (e.g. after a redeploy) never duplicates rows.
//
// Run against the target database's DATABASE_URL, e.g. on the VPS:
//   docker compose --profile tools run --rm --entrypoint \
//     "npx tsx scripts/seed-demo-data.ts" jejaku-receipt-migrate

import { eq } from "drizzle-orm";
import { db } from "../app/db";
import { users } from "../app/db/schema";
import { seedDemoExpenses } from "../app/lib/demoData";

async function main() {
  const user = await db.query.users.findFirst();
  if (!user) {
    console.log("No user found — sign in once first, then re-run this script.");
    return;
  }

  const existing = await db.query.expenses.findFirst({
    where: (expensesTable, { eq: eqFn }) => eqFn(expensesTable.userId, user.id),
  });
  if (existing) {
    console.log(`User ${user.email} already has expenses — skipping seed to avoid duplicates.`);
    return;
  }

  const count = await seedDemoExpenses(user.id, user.defaultCurrency);
  // Mark the account as already-seeded so the app's own auto-seed (on next
  // dashboard load) doesn't insert a second batch on top of this one.
  await db.update(users).set({ demoSeededAt: new Date() }).where(eq(users.id, user.id));
  console.log(`Done — ${count} expenses seeded for ${user.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
