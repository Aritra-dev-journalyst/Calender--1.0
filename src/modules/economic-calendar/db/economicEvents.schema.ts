// src/modules/economic-calendar/db/economicEvents.schema.ts
// FULL UPDATED FILE — replaces previous version entirely

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    jsonb,
    integer,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const economicEvents = pgTable(
    'economic_events',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        // ── Source ──────────────────────────────────────────────
        source: varchar('source', { length: 50 }).notNull(),
        sourceKey: varchar('source_key', { length: 255 }).notNull(),

        // ── Core event data ──────────────────────────────────────
        title: text('title').notNull(),
        currency: varchar('currency', { length: 10 }),
        impact: varchar('impact', { length: 20 }),

        // ── Time ────────────────────────────────────────────────
        eventDay: varchar('event_day', { length: 20 }),
        eventTimeRaw: varchar('event_time_raw', { length: 50 }),
        startsAtUtc: timestamp('starts_at_utc', { withTimezone: true }),

        // ── Release values ───────────────────────────────────────
        actual: text('actual'),
        forecast: text('forecast'),
        previous: text('previous'),
        revised: text('revised'),              // NEW — revised value

        // ── Description fields ───────────────────────────────────
        detail: text('detail'),               // from Ehsanrs2
        description: text('description'),     // NEW — full description
        whyItMatters: text('why_it_matters'), // NEW
        usualEffect: text('usual_effect'),    // NEW
        frequency: varchar('frequency', { length: 100 }), // NEW
        nextRelease: varchar('next_release', { length: 100 }), // NEW
        ffUrl: varchar('ff_url', { length: 500 }), // NEW
        ffEventId: varchar('ff_event_id', { length: 50 }), // NEW - For detail fetching
        descriptionSource: varchar('description_source', { length: 50 }), // NEW - Source of description (wiki, investing, ff)

        // ── Status flags ────────────────────────────────────────
        status: varchar('status', { length: 20 })
            .notNull()
            .default('scheduled'),
        isAllDay: boolean('is_all_day').notNull().default(false),
        isTentative: boolean('is_tentative').notNull().default(false),

        // ── Prediction tracking (NEW) ────────────────────────────
        isPredicted: boolean('is_predicted').notNull().default(false),
        predictedAt: timestamp('predicted_at', { withTimezone: true }),
        predictionSource: varchar('prediction_source', { length: 100 }),

        // ── Sync tracking (NEW) ──────────────────────────────────
        lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
        syncVersion: integer('sync_version').notNull().default(1),

        // ── Meta ────────────────────────────────────────────────
        parserVersion: varchar('parser_version', { length: 50 }),
        rawPayload: jsonb('raw_payload'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        sourceKeyUq: uniqueIndex('uq_economic_events_source_key')
            .on(table.source, table.sourceKey),
        startsAtIdx: index('idx_economic_events_starts_at')
            .on(table.startsAtUtc),
        currencyIdx: index('idx_economic_events_currency')
            .on(table.currency),
        impactIdx: index('idx_economic_events_impact')
            .on(table.impact),
        eventDayIdx: index('idx_economic_events_event_day')
            .on(table.eventDay),
        statusIdx: index('idx_economic_events_status')
            .on(table.status),
        // NEW — for finding next upcoming event quickly
        upcomingIdx: index('idx_economic_events_upcoming')
            .on(table.startsAtUtc, table.status, table.impact),
    })
);

export const economicEventSyncRuns = pgTable(
    'economic_event_sync_runs',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        jobType: varchar('job_type', { length: 50 }).notNull(),
        source: varchar('source', { length: 50 }).notNull(),
        startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
        finishedAt: timestamp('finished_at', { withTimezone: true }),
        status: varchar('status', { length: 20 }).notNull(),
        rowsSeen: integer('rows_seen').default(0),
        rowsInserted: integer('rows_inserted').default(0),
        rowsUpdated: integer('rows_updated').default(0),
        errorMessage: text('error_message'),
        // NEW — track what triggered the sync
        triggerReason: varchar('trigger_reason', { length: 100 }),
        nextScheduledAt: timestamp('next_scheduled_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);

export const tradeEventLinks = pgTable(
    'trade_event_links',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        tradeId: uuid('trade_id').notNull(),
        eventId: uuid('event_id').notNull(),
        minutesFromEntry: integer('minutes_from_entry'),
        minutesFromExit: integer('minutes_from_exit'),
        relationType: varchar('relation_type', { length: 30 }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);