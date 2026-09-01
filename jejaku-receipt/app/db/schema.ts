import { pgTable, uuid, text, timestamp, doublePrecision, jsonb, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  customCategories: jsonb("custom_categories").$type<string[]>().notNull().default([]),
  // Set the first (and only the first) time this account's demo data is
  // seeded — see app/lib/demoData.ts. Gates the one-time auto-seed on
  // account creation so it never re-fires after the user deletes their
  // demo receipts.
  demoSeededAt: timestamp("demo_seeded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  merchant: text("merchant").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  tax: doublePrecision("tax"),
  // True for rows inserted by the demo-data seed (auto, on account
  // creation, or manually re-triggered from Settings) — lets "Remove demo
  // data" delete exactly those rows and nothing the user entered
  // themselves, unlike the Danger Zone's full wipe.
  isDemo: boolean("is_demo").notNull().default(false),
  // User-set tag, not auto-detected — lets someone mark a receipt as
  // something they'll need for a warranty claim later, so it can be
  // filtered for and found quickly instead of scrolling every receipt.
  isWarrantyClaim: boolean("is_warranty_claim").notNull().default(false),
  note: text("note"),
  photoUrl: text("photo_url"),
  location: text("location"),
  currency: text("currency"),
  // Snapshot conversion into the user's home currency at the time this
  // expense was saved (or last re-converted, if the home currency was
  // changed later) — this is what aggregate stats (Total Spent, Monthly
  // Trend) sum, so they stay meaningful when receipts span currencies.
  // NOT recomputed live: FX rates move daily, and "how much I spent" for a
  // past month shouldn't shift every time the dashboard is reopened.
  homeCurrencyAmount: doublePrecision("home_currency_amount"),
  homeCurrencyCode: text("home_currency_code"),
  items: jsonb("items").$type<{ name: string; price: number }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// A running log of account-level actions — every expense created, edited,
// or deleted, categories added, demo data seeded/removed, and the Danger
// Zone wipe. Shown in Settings so a user can see what happened to their
// data and when, not derived from the expenses table itself since rows
// there get overwritten or deleted (an edit/delete wouldn't leave a trace
// otherwise).
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
