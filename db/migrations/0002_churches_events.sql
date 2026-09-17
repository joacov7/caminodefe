CREATE TABLE "church_events" (
	"id" text PRIMARY KEY NOT NULL,
	"church_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_times" (
	"id" text PRIMARY KEY NOT NULL,
	"church_id" text NOT NULL,
	"day" text NOT NULL,
	"time" text NOT NULL,
	"label" text
);
--> statement-breakpoint
ALTER TABLE "church_events" ADD CONSTRAINT "church_events_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_times" ADD CONSTRAINT "service_times_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_events_church_idx" ON "church_events" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "service_times_church_idx" ON "service_times" USING btree ("church_id");