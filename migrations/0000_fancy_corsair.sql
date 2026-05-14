CREATE TABLE "economic_event_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" varchar(20) NOT NULL,
	"rows_seen" integer DEFAULT 0,
	"rows_inserted" integer DEFAULT 0,
	"rows_updated" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "economic_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(50) NOT NULL,
	"source_key" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"currency" varchar(10),
	"impact" varchar(20),
	"event_day" varchar(20),
	"event_time_raw" varchar(50),
	"starts_at_utc" timestamp with time zone,
	"actual" text,
	"forecast" text,
	"previous" text,
	"detail" text,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"is_tentative" boolean DEFAULT false NOT NULL,
	"parser_version" varchar(50),
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_event_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"minutes_from_entry" integer,
	"minutes_from_exit" integer,
	"relation_type" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_economic_events_source_key" ON "economic_events" USING btree ("source","source_key");--> statement-breakpoint
CREATE INDEX "idx_economic_events_starts_at" ON "economic_events" USING btree ("starts_at_utc");--> statement-breakpoint
CREATE INDEX "idx_economic_events_currency" ON "economic_events" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "idx_economic_events_impact" ON "economic_events" USING btree ("impact");--> statement-breakpoint
CREATE INDEX "idx_economic_events_event_day" ON "economic_events" USING btree ("event_day");