import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSignInAt: timestamp("last_sign_in_at"),
});

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Every lookup here (createOtp's active-code check, verifyOtp, the
  // already-confirmed check) filters on email — without this, Postgres
  // sequentially scans the whole table on every sign-in/verification
  // attempt, which is also the app's highest-frequency query.
  index("otp_codes_email_idx").on(table.email),
]);

// A durable, queryable record of unexpected server errors — see
// withApiErrorHandling in lib/apiError.ts, the one place this gets
// written. Self-hosted (a table in this app's own database) rather than a
// third-party error-tracking service on purpose: this project's Privacy
// Policy states no analytics or third-party scripts run at all, and
// sending exception data to an external service would mean disclosing
// and depending on one. `psql` against this table is the intended way to
// check it — no admin UI exists for it, and none is planned; this is
// meant to answer "did anything break" after a deploy, not to be a
// product feature. Mirrors jejaku-receipt's identical table.
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Not a foreign key to users — an error can happen before a session is
  // ever resolved (a malformed request, a DB outage), so this can't
  // assume an authenticated user exists yet.
  route: text("route").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("error_logs_created_at_idx").on(table.createdAt),
]);
