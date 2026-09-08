CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"partner_a_id" uuid,
	"partner_b_id" uuid,
	"status" text DEFAULT 'married' NOT NULL,
	"union_date" text,
	"union_date_precision" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"rel_to_a" text DEFAULT 'biological' NOT NULL,
	"rel_to_b" text DEFAULT 'biological' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_children_family_id_child_id_unique" UNIQUE("family_id","child_id")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"given_name" text NOT NULL,
	"family_name" text,
	"sex" text DEFAULT 'unknown' NOT NULL,
	"birth_date" text,
	"birth_date_precision" text,
	"is_deceased" boolean DEFAULT false NOT NULL,
	"death_date" text,
	"death_date_precision" text,
	"birth_place" text,
	"occupation" text,
	"note" text,
	"photo_url" text,
	"claimed_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tree_members_tree_id_user_id_unique" UNIQUE("tree_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_partner_a_id_people_id_fk" FOREIGN KEY ("partner_a_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_partner_b_id_people_id_fk" FOREIGN KEY ("partner_b_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_children" ADD CONSTRAINT "family_children_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_children" ADD CONSTRAINT "family_children_child_id_people_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_members" ADD CONSTRAINT "tree_members_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_members" ADD CONSTRAINT "tree_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trees" ADD CONSTRAINT "trees_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "error_logs_created_at_idx" ON "error_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "families_tree_id_idx" ON "families" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "families_partner_a_id_idx" ON "families" USING btree ("partner_a_id");--> statement-breakpoint
CREATE INDEX "families_partner_b_id_idx" ON "families" USING btree ("partner_b_id");--> statement-breakpoint
CREATE INDEX "family_children_family_id_idx" ON "family_children" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_children_child_id_idx" ON "family_children" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "people_tree_id_idx" ON "people" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "tree_members_user_id_idx" ON "tree_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trees_owner_user_id_idx" ON "trees" USING btree ("owner_user_id");