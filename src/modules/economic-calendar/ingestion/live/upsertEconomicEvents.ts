// src/modules/economic-calendar/ingestion/live/upsertEconomicEvents.ts
// COMPLETE FIXED FILE

import { db } from '@/db';
import { economicEvents } from '../../db';
import { sql } from 'drizzle-orm';
import type { UpsertResult } from '../../domain/types';

// PostgreSQL parameter limit safety
// 30 columns per row × 200 rows = 6000 params (safe under 65535)
const CHUNK_SIZE = 200;

type EventInput = {
    source: string;
    sourceKey: string;
    title: string;
    currency: string | null;
    impact: string | null;
    eventDay: string | null;
    eventTimeRaw: string | null;
    startsAtUtc: Date | null;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
    revised: string | null;
    detail: string | null;
    description: string | null;
    whyItMatters: string | null;
    usualEffect: string | null;
    frequency: string | null;
    nextRelease: string | null;
    ffUrl: string | null;
    ffEventId: string | null;
    status: 'scheduled' | 'released';
    isAllDay: boolean;
    isTentative: boolean;
    isPredicted: boolean;
    predictedAt: Date | null;
    predictionSource: string | null;
    lastSyncedAt: Date | null;
    syncVersion: number;
    parserVersion: string | null;
    rawPayload: unknown;
    updatedAt: Date;
};

export async function upsertEconomicEvents(
    events: EventInput[]
): Promise<UpsertResult> {
    if (events.length === 0) {
        return { inserted: 0, updated: 0, skipped: 0 };
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const now = new Date();

    // Split into chunks to avoid PostgreSQL parameter limit
    const chunks = chunkArray(events, CHUNK_SIZE);

    console.log(
        `[Upsert] Processing ${events.length} events in ${chunks.length} chunks`
    );

    for (const chunk of chunks) {
        try {
            await db
                .insert(economicEvents)
                .values(
                    chunk.map(e => ({
                        source: e.source,
                        sourceKey: e.sourceKey,
                        title: e.title,
                        currency: e.currency,
                        impact: e.impact,
                        eventDay: e.eventDay,
                        eventTimeRaw: e.eventTimeRaw,
                        startsAtUtc: e.startsAtUtc,
                        actual: e.actual,
                        forecast: e.forecast,
                        previous: e.previous,
                        revised: e.revised,
                        detail: e.detail,
                        description: e.description,
                        whyItMatters: e.whyItMatters,
                        usualEffect: e.usualEffect,
                        frequency: e.frequency,
                        nextRelease: e.nextRelease,
                        ffUrl: e.ffUrl,
                        ffEventId: e.ffEventId,
                        status: e.status,
                        isAllDay: e.isAllDay,
                        isTentative: e.isTentative,
                        isPredicted: e.isPredicted,
                        predictedAt: e.predictedAt,
                        predictionSource: e.predictionSource,
                        lastSyncedAt: now,
                        syncVersion: e.syncVersion,
                        parserVersion: e.parserVersion,
                        rawPayload: e.rawPayload,
                        updatedAt: now,
                    }))
                )
                .onConflictDoUpdate({
                    target: [economicEvents.source, economicEvents.sourceKey],
                    set: {
                        // Use sql`excluded.column` — the correct Drizzle pattern
                        actual: sql`excluded.actual`,
                        forecast: sql`excluded.forecast`,
                        previous: sql`excluded.previous`,
                        revised: sql`excluded.revised`,
                        status: sql`excluded.status`,
                        startsAtUtc: sql`excluded.starts_at_utc`,
                        isPredicted: sql`excluded.is_predicted`,
                        predictedAt: sql`excluded.predicted_at`,
                        predictionSource: sql`excluded.prediction_source`,
                        description: sql`COALESCE(excluded.description, ${economicEvents.description})`,
                        whyItMatters: sql`COALESCE(excluded.why_it_matters, ${economicEvents.whyItMatters})`,
                        usualEffect: sql`COALESCE(excluded.usual_effect, ${economicEvents.usualEffect})`,
                        frequency: sql`COALESCE(excluded.frequency, ${economicEvents.frequency})`,
                        nextRelease: sql`COALESCE(excluded.next_release, ${economicEvents.nextRelease})`,
                        ffEventId: sql`excluded.ff_event_id`,
                        rawPayload: sql`excluded.raw_payload`,
                        lastSyncedAt: sql`excluded.last_synced_at`,
                        syncVersion: sql`excluded.sync_version`,
                        updatedAt: sql`excluded.updated_at`,
                    },
                });

            totalInserted += chunk.length;

        } catch (err) {
            console.error(
                `[Upsert] Chunk failed (${chunk.length} rows):`,
                err instanceof Error ? err.message : err
            );
            totalSkipped += chunk.length;
        }
    }

    return {
        inserted: totalInserted,
        updated: 0,
        skipped: totalSkipped,
    };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}