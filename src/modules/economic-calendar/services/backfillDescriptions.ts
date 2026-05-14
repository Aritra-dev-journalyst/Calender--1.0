// src/modules/economic-calendar/services/backfillDescriptions.ts

import { db } from '@/db';
import { economicEvents } from '../db';
import { isNull, and, eq, or } from 'drizzle-orm';
import { fetchEventDescription } from './fetchEventDescription';
import { detectEventType } from '../utils/eventDescriptions';

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

export async function backfillMissingDescriptions(): Promise<void> {
    console.log('[Backfill] Starting...\n');

    const events = await db.query.economicEvents.findMany({
        where: and(
            or(
                isNull(economicEvents.description),
                isNull(economicEvents.detail)
            ),
            isNull(economicEvents.descriptionSource)
        ),
        columns: {
            id: true,
            title: true,
            currency: true,
        },
    });

    // Deduplicate
    const seen = new Set<string>();
    const unique = events.filter(e => {
        if (!e.title || !e.currency) return false;
        const key = `${e.title.toLowerCase()}|${e.currency}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`Total unique events: ${unique.length}\n`);

    // Group by event type for better logging
    const byType = {
        speech: 0,
        meeting: 0,
        report: 0,
        auction: 0,
        holiday: 0,
        data_release: 0,
        unknown: 0,
    };

    unique.forEach(e => {
        const type = detectEventType(e.title ?? '');
        byType[type]++;
    });

    console.log('Event types found:');
    Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log('');

    let filled = 0;
    let failed = 0;
    const failedEvents: string[] = [];

    for (let i = 0; i < unique.length; i++) {
        const event = unique[i];
        const eventType = detectEventType(event.title ?? '');

        process.stdout.write(
            `[${i + 1}/${unique.length}] ${event.title} (${event.currency}) `
        );

        const result = await fetchEventDescription(
            event.title ?? '',
            event.currency ?? ''
        );

        if (result.description) {
            // Update all rows with this title + currency
            await db
                .update(economicEvents)
                .set({
                    description: result.description,
                    whyItMatters: result.whyItMatters,
                    usualEffect: result.usualEffect,
                    frequency: result.frequency,
                    ffUrl: result.sourceUrl,
                    descriptionSource: result.source,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(economicEvents.title, event.title ?? ''),
                        eq(economicEvents.currency, event.currency ?? '')
                    )
                );

            filled++;
            console.log(`✅ [${result.source}]`);
        } else {
            failed++;
            failedEvents.push(`${event.title} (${event.currency})`);
            console.log(`❌ [${eventType}]`);
        }

        // Respectful rate limiting
        await sleep(800);
    }

    // Final report
    console.log('\n══════════════════════════════');
    console.log('Backfill Complete');
    console.log(`  ✅ Filled:  ${filled}`);
    console.log(`  ❌ Failed:  ${failed}`);
    console.log(`  Total:     ${unique.length}`);
    console.log(
        `  Coverage:  ${Math.round((filled / unique.length) * 100)}%`
    );

    if (failedEvents.length > 0 && failedEvents.length <= 20) {
        console.log('\nStill missing:');
        failedEvents.forEach(e => console.log(`  - ${e}`));
    }
}