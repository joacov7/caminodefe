CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'confirmed', 'failed', 'refunded', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."contribution_type" AS ENUM('platform', 'church', 'mission');--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "contribution_type" NOT NULL,
	"recipient_church_id" text,
	"amount_minor" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"note" text,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_recipient_church_id_churches_id_fk" FOREIGN KEY ("recipient_church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contributions_user_idx" ON "contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contributions_recipient_idx" ON "contributions" USING btree ("recipient_church_id");