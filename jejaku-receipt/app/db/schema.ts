import { pgTable, uuid, text, timestamp, doublePrecision, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";
import type { ExpenseItem } from "../lib/expenses";
import type { PaymentQrCode } from "../lib/paymentQr";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  customCategories: jsonb("custom_categories").$type<string[]>().notNull().default([]),
  // Up to MAX_PAYMENT_QR_CODES (lib/paymentQr.ts) of the user's own
  // payment QRs (e.g. bank transfer, Touch 'n Go, DuitNow), uploaded once
  // from Settings and picked from on every split-bill share card — see
  // ShareSplitModal. Not shared with jejaku (unlike avatar/currency):
  // scoped to this app's own users row since it's only ever relevant to
  // sharing a split receipt.
  paymentQrCodes: jsonb("payment_qr_codes").$type<PaymentQrCode[]>().notNull().default([]),
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
  // How many months of coverage from `date` (the purchase date) — null
  // means "tagged, but no coverage length set" (e.g. a claim tagged before
  // this field existed, or a warranty of unknown length). Only meaningful
  // alongside isWarrantyClaim; lets the expiry be derived (date + months)
  // instead of storing a second date that could drift out of sync with it.
  warrantyMonths: integer("warranty_months"),
  note: text("note"),
  photoUrl: text("photo_url"),
  location: text("location"),
  // Structured in favor of the free-text `location` above (kept only so old
  // rows aren't orphaned) — city/state/country extracted or entered per
  // receipt, plus an approximate city-centroid lat/lng resolved from them
  // via the offline lookup in lib/cityCoordinates.ts. Powers the location
  // history map/list; not geocoded to the exact street address.
  city: text("city"),
  state: text("state"),
  country: text("country"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  currency: text("currency"),
  // Snapshot conversion into the user's home currency at the time this
  // expense was saved (or last re-converted, if the home currency was
  // changed later) — this is what aggregate stats (Total Spent, Monthly
  // Trend) sum, so they stay meaningful when receipts span currencies.
  // NOT recomputed live: FX rates move daily, and "how much I spent" for a
  // past month shouldn't shift every time the dashboard is reopened.
  homeCurrencyAmount: doublePrecision("home_currency_amount"),
  homeCurrencyCode: text("home_currency_code"),
  // Typed against the single ExpenseItem definition in lib/expenses.ts
  // (including each item's own optional isWarrantyClaim/warrantyMonths)
  // rather than a second inline shape here, so the two can't drift apart —
  // jsonb itself doesn't enforce structure, this is a TS-only annotation,
  // so widening it (as when warranty fields were added to ExpenseItem)
  // never requires a migration.
  items: jsonb("items").$type<ExpenseItem[]>(),
  // Ad-hoc per-item bill split — see lib/expenses.ts's SplitData for the
  // shape and computeSplitTotals for how tax gets divided proportionally.
  // Not a separate table: like `items`, this is only ever read/written
  // whole, alongside the same expense, so a join buys nothing here.
  split: jsonb("split").$type<{ people: string[]; assignments: { itemIndex: number; people: string[] }[] }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Every query in this app filters on userId — without this, Postgres
  // sequentially scans the whole table on every dashboard/receipts-page
  // load, invisible at today's row counts but real once accounts grow.
  index("expenses_user_id_idx").on(table.userId),
  // Additionally covers the receipt-date sort every list/dashboard query
  // already does (see ReceiptsList's sortedExpenses, the dashboard tiles'
  // month bucketing) — a composite index serves both the plain userId
  // filter and the userId+date ordering from one index.
  index("expenses_user_id_date_idx").on(table.userId, table.date),
]);

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
}, (table) => [
  // Settings' audit trail query filters on userId and orders by
  // createdAt (capped at 500 rows) — this is the fastest-growing table in
  // the app (a row on every expense create/edit/delete), so it's the one
  // most worth indexing even before expenses is.
  index("audit_logs_user_id_created_at_idx").on(table.userId, table.createdAt),
]);

// A durable, queryable record of unexpected server errors — see
// withApiErrorHandling in lib/apiError.ts, the one place this gets
// written. Self-hosted (a table in this app's own database) rather than a
// third-party error-tracking service on purpose: this project's Privacy
// Policy states no analytics or third-party scripts run at all, and
// sending exception data (which can carry request specifics) to an
// external service would mean disclosing and depending on one. `psql`
// against this table is the intended way to check it — no admin UI exists
// for it, and none is planned; this is meant to answer "did anything
// break" after a deploy, not to be a product feature.
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Not a foreign key to users — an error can happen before
  // getCurrentUser() ever resolves (a malformed request, a DB outage), so
  // this can't assume an authenticated user exists yet.
  route: text("route").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("error_logs_created_at_idx").on(table.createdAt),
]);
