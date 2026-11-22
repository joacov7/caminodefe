CREATE TABLE "prayer_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"church_id" text,
	"scope" text DEFAULT 'private' NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"answer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prayer_requests_user_idx" ON "prayer_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prayer_requests_church_idx" ON "prayer_requests" USING btree ("church_id");