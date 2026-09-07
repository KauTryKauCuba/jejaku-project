import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// Deliberately minimal — this app has no features yet (see AGENTS.md /
// the project's current state). One row per account, created the first
// time a signed-in jejaku session hits this app (see lib/auth.ts's jwt
// callback), mirroring jejaku-receipt's same bootstrap pattern. Extend
// this table as real features land, not ahead of them.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
