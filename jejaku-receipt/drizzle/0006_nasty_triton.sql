ALTER TABLE "expenses" ADD COLUMN "home_currency_amount" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "home_currency_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_currency" text DEFAULT 'USD' NOT NULL;