ALTER TABLE "expenses" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "demo_seeded_at" timestamp;--> statement-breakpoint
-- Existing accounts predate the auto-seed feature and shouldn't suddenly
-- get demo data injected on their next dashboard visit — close the gate
-- for everyone who already exists as of this migration. Only accounts
-- created after this point (demo_seeded_at starts NULL for them) get the
-- automatic seed.
UPDATE "users" SET "demo_seeded_at" = now() WHERE "demo_seeded_at" IS NULL;