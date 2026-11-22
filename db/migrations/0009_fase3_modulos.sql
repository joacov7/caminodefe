CREATE TABLE "analytics_daily" (
	"day" text NOT NULL,
	"event" text NOT NULL,
	"dim" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_daily_day_event_dim_pk" PRIMARY KEY("day","event","dim")
);
--> statement-breakpoint
CREATE TABLE "answer_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"normalized_question" text NOT NULL,
	"embedding" jsonb NOT NULL,
	"answer" text NOT NULL,
	"model" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"invalidated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_library" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"normalized_question" text NOT NULL,
	"answer" text NOT NULL,
	"status" "editorial_status" DEFAULT 'draft' NOT NULL,
	"embedding" jsonb,
	"created_by" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"retired_at" timestamp,
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guided_path_progress" (
	"user_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"reflection" text,
	CONSTRAINT "guided_path_progress_user_id_stage_id_pk" PRIMARY KEY("user_id","stage_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_plan_days" (
	"user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"day" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_plan_days_user_id_plan_id_day_pk" PRIMARY KEY("user_id","plan_id","day")
);
--> statement-breakpoint
CREATE TABLE "reminder_prefs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"time" text DEFAULT '08:00' NOT NULL,
	"days" jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb NOT NULL,
	"timezone" text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "church_events" ADD COLUMN "ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "church_events" ADD COLUMN "online_url" text;--> statement-breakpoint
ALTER TABLE "church_events" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "church_events" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "churches" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "answer_library" ADD CONSTRAINT "answer_library_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_library" ADD CONSTRAINT "answer_library_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guided_path_progress" ADD CONSTRAINT "guided_path_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_plan_days" ADD CONSTRAINT "reading_plan_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_prefs" ADD CONSTRAINT "reminder_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answer_cache_question_idx" ON "answer_cache" USING btree ("normalized_question");--> statement-breakpoint
CREATE INDEX "answer_library_status_idx" ON "answer_library" USING btree ("status");--> statement-breakpoint
ALTER TABLE "church_events" ADD CONSTRAINT "church_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_events_starts_idx" ON "church_events" USING btree ("starts_at");