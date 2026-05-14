ALTER TABLE "economic_event_sync_runs" ADD COLUMN "trigger_reason" varchar(100);--> statement-breakpoint
ALTER TABLE "economic_event_sync_runs" ADD COLUMN "next_scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "revised" text;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "why_it_matters" text;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "usual_effect" text;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "frequency" varchar(100);--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "next_release" varchar(100);--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "ff_url" varchar(500);--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "is_predicted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "predicted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "prediction_source" varchar(100);--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN "sync_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_economic_events_status" ON "economic_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_economic_events_upcoming" ON "economic_events" USING btree ("starts_at_utc","status","impact");