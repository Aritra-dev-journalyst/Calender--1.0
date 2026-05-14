import { db } from '@/db';
import { economicEvents } from '../../db';
import { and, eq } from 'drizzle-orm';
import { fetchFFAllFeeds } from '../live/fetchFFJsonFeed';
import { FFJsonEvent, normalizeFFJsonEvent } from '../live/normalizeFFJsonEvent';
import { upsertEconomicEvents } from '../live/upsertEconomicEvents';
import { logSyncRun } from './logSyncRun';
import { sendAlert } from './alerts';
import { fetchEventDescription } from '../../services/fetchEventDescription';

export async function runForwardSync(options: { triggerReason?: string; nextScheduledAt?: Date | null } = {}): Promise<void> {
    const startedAt = new Date();
    console.log('[ForwardSync] Starting (JSON Feeds)...');

    let totalSeen = 0;
    let totalInserted = 0;
    let error: string | null = null;

    try {
        const feeds = await fetchFFAllFeeds();
        const allEvents = [...feeds.thisWeek, ...feeds.nextWeek];

        const normalizedEvents = allEvents.map((event: FFJsonEvent) =>
            normalizeFFJsonEvent(event, {
                predictionSource: 'ff_json_feed'
            })
        );

        const result = await upsertEconomicEvents(normalizedEvents as any);
        
        // NEW: Fill missing descriptions for the new events
        await fillMissingDescriptionsForNewEvents(normalizedEvents);

        totalSeen = allEvents.length;
        totalInserted = result.inserted;

        console.log(`[ForwardSync] Success. Seen: ${totalSeen}, Inserted: ${totalInserted}`);
    } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[ForwardSync] Failed: ${error}`);

        await sendAlert('critical', 'Forward sync failed', { error });
    }

    await logSyncRun({
        jobType: 'forward_sync',
        source: 'forexfactory_json',
        startedAt,
        finishedAt: new Date(),
        status: error ? 'failed' : 'success',
        rowsSeen: totalSeen,
        rowsInserted: totalInserted,
        rowsUpdated: 0,
        errorMessage: error,
        triggerReason: options.triggerReason,
        nextScheduledAt: options.nextScheduledAt,
    });
}

async function fillMissingDescriptionsForNewEvents(
    events: any[]
): Promise<void> {
    const needsDescription = events.filter(
        e => !e.description && e.title && e.currency
    );

    if (needsDescription.length === 0) return;

    console.log(
        `[ForwardSync] Fetching descriptions for ${needsDescription.length} events...`
    );

    const seen = new Set<string>();
    for (const event of needsDescription) {
        const key = `${event.title?.toLowerCase()}|${event.currency}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const result = await fetchEventDescription(
            event.title,
            event.currency
        );

        if (!result.description) continue;

        await db
            .update(economicEvents)
            .set({
                description: result.description,
                whyItMatters: result.whyItMatters,
                usualEffect: result.usualEffect,
                ffUrl: result.sourceUrl,
                descriptionSource: result.source ?? 'backfill',
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(economicEvents.title, event.title),
                    eq(economicEvents.currency, event.currency)
                )
            );

        console.log(`  ✅ ${event.title}: from ${result.source}`);
        await new Promise(r => setTimeout(r, 1200));
    }
}