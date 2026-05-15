ALTER TABLE "economic_events" ADD COLUMN IF NOT EXISTS "ff_event_id" varchar(50);--> statement-breakpoint
ALTER TABLE "economic_events" ADD COLUMN IF NOT EXISTS "description_source" varchar(50);