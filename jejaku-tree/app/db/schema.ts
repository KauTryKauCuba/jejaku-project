import { pgTable, uuid, text, timestamp, boolean, index, unique } from "drizzle-orm/pg-core";

// One row per account, created the first time a signed-in jejaku session
// hits this app (see lib/auth.ts's jwt callback), mirroring
// jejaku-receipt's same bootstrap pattern.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// A tree is owned by one account but not folded into `users` 1:1 — this
// leaves room for shared/collaborative trees (see tree_members below)
// without a schema change later. v1 UI only ever creates and shows the
// single tree an account owns (see lib/tree.ts's getOrCreateTree), but the
// data model doesn't assume that stays true.
export const trees = pgTable("trees", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("trees_owner_user_id_idx").on(table.ownerUserId),
]);

// Who can see/edit a tree beyond its owner. Not read anywhere yet in v1
// (only the owner ever opens their own tree), but this is the table an
// invite/claim flow needs to exist against — adding it after people start
// using the app would mean retrofitting permission checks onto every
// route instead of having them from the start.
export const treeMembers = pgTable("tree_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id")
    .notNull()
    .references(() => trees.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"), // "owner" | "editor"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique("tree_members_tree_id_user_id_unique").on(table.treeId, table.userId),
  index("tree_members_user_id_idx").on(table.userId),
]);

// One row per family-tree card. `sex` is "male" | "female" | "unknown"
// (validated in lib/people.ts, not a pg enum — matches this codebase's
// existing pattern of plain text + app-level validation, see
// jejaku-receipt's `category` column) — drives both which pronoun/label
// the relationship engine renders (lib/relationship.ts) and which slot a
// person can fill in a `families` row.
//
// Dates are free-text, not a `date` column: genealogical dates are
// routinely fuzzy ("about 1940", just a year, unknown) and a strict date
// type can't represent that. `birthDatePrecision`/`deathDatePrecision`
// records how much of the free-text value to trust for sorting/age math.
export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id")
    .notNull()
    .references(() => trees.id, { onDelete: "cascade" }),
  givenName: text("given_name").notNull(),
  familyName: text("family_name"),
  sex: text("sex").notNull().default("unknown"),
  birthDate: text("birth_date"),
  birthDatePrecision: text("birth_date_precision"), // "day" | "month" | "year"
  isDeceased: boolean("is_deceased").notNull().default(false),
  deathDate: text("death_date"),
  deathDatePrecision: text("death_date_precision"),
  birthPlace: text("birth_place"),
  occupation: text("occupation"),
  note: text("note"),
  photoUrl: text("photo_url"),
  // Set once this card is claimed by a real account via the invite flow
  // (not built yet) — lets the same person appear as both "a card someone
  // else entered" and "an account that can edit its own card". Nullable:
  // most cards, especially deceased ancestors, will never be claimed.
  claimedByUserId: uuid("claimed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Every query in this app filters on treeId (loading the whole tree in
  // one shot — see lib/tree.ts) — same rationale as jejaku-receipt's
  // expenses_user_id_idx.
  index("people_tree_id_idx").on(table.treeId),
]);

// A partnership (married, divorced, or otherwise) between zero, one, or
// two people, plus the children born/adopted into it. This is the "union"
// model genealogy software has used for decades (GEDCOM's FAM record) —
// see the design note below for why this beats a `fatherId`/`motherId`
// pair directly on `people`.
//
// Why a union table instead of parent pointers on `people`:
// - Siblings fall out for free (same familyId) instead of needing a
//   second table kept in sync by hand.
// - Half-siblings are just two different `families` rows sharing one
//   partner — impossible to represent cleanly with two pointer columns.
// - Remarriage is a second `families` row, not a mutation that loses the
//   first marriage's data.
// - Divorce/widowed status and a union date have somewhere to live.
// - Both partner slots are nullable so a single parent (or two unknown
//   parents, see lib/relatives.ts's addSibling) is representable too.
export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  treeId: uuid("tree_id")
    .notNull()
    .references(() => trees.id, { onDelete: "cascade" }),
  // Nullable, and deliberately `set null` (not cascade) on delete — if a
  // partner card is deleted, the union and any children it produced
  // should survive with that slot emptied, not disappear with them.
  partnerAId: uuid("partner_a_id").references(() => people.id, { onDelete: "set null" }),
  partnerBId: uuid("partner_b_id").references(() => people.id, { onDelete: "set null" }),
  status: text("status").notNull().default("married"), // married|divorced|separated|widowed|partnered|unknown
  unionDate: text("union_date"),
  unionDatePrecision: text("union_date_precision"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("families_tree_id_idx").on(table.treeId),
  index("families_partner_a_id_idx").on(table.partnerAId),
  index("families_partner_b_id_idx").on(table.partnerBId),
]);

// Which children belong to which family. Kept as its own table (not an
// array column on `families`) so a child can be looked up by id without
// scanning every family's list, and so relToA/relToB can vary per child
// (e.g. one biological, one step) within the same family.
//
// v1 constrains a person to being a child in at most one family (their
// birth family) — see lib/relatives.ts's addParent/addSibling, which
// reuse an existing family row rather than create a second one. relToA/
// relToB exist now so step/adopted parents can be layered on later
// without a migration, but that flow isn't built yet.
export const familyChildren = pgTable("family_children", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  relToA: text("rel_to_a").notNull().default("biological"), // biological|adopted|step|foster
  relToB: text("rel_to_b").notNull().default("biological"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique("family_children_family_id_child_id_unique").on(table.familyId, table.childId),
  index("family_children_family_id_idx").on(table.familyId),
  index("family_children_child_id_idx").on(table.childId),
]);

// A durable, queryable record of unexpected server errors — see
// withApiErrorHandling in lib/apiError.ts, the one place this gets
// written. Same rationale as jejaku-receipt's copy of this table: no
// admin UI, `psql` is the intended way to check it, self-hosted rather
// than a third-party error tracker per this project's Privacy Policy.
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Not a foreign key to users — an error can happen before
  // getCurrentUser() ever resolves.
  route: text("route").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("error_logs_created_at_idx").on(table.createdAt),
]);
