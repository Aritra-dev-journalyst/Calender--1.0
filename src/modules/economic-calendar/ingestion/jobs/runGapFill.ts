// src/modules/economic-calendar/ingestion/jobs/runGapFill.ts

import { startOfWeek } from 'date-fns';
import { fetchForexFactoryHtml } from '../live/fetchForexFactoryHtml';
import { parseForexFactoryCalendar } from '../live/parseForexFactoryCalendar';
import { upsertEconomicEvents } from '../live/upsertEconomicEvents';
import { logSyncRun } from './logSyncRun';
import { FF_BASE_URL, PARSER_VERSION } from '../../domain/constants';
import { buildEventFingerprint } from '../../utils/eventFingerprint';
import { normalizeImpact } from '../../utils/impact';
import { parseForexFactoryTime } from '../../utils/timezone';
import { propagateDescriptions } from '../../services/propagateDescriptions';

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

export async function runGapFill(
    gapStart: Date = new Date('2025-04-07'),
    gapEnd: Date = new Date()
): Promise<void> {
    const startedAt = new Date();

    console.log('[GapFill] Starting...');
    console.log(
        `[GapFill] Range: ${gapStart.toISOString().slice(0, 10)} → ${gapEnd.toISOString().slice(0, 10)}`
    );

    // We'll iterate by month
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // We'll iterate by month
    let currentMonth = gapStart.getMonth();
    let currentYear = gapStart.getFullYear();

    let totalInserted = 0;
    let totalFailed = 0;
    let monthsProcessed = 0;

    const endYear = gapEnd.getFullYear();
    const endMonth = gapEnd.getMonth();

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const monthStr = monthNames[currentMonth];
        const url = `${FF_BASE_URL}/calendar?month=${monthStr}.${currentYear}`;

        console.log(`[GapFill] Fetching Month: ${monthStr.toUpperCase()} ${currentYear}`);

        const fetchResult = await fetchForexFactoryHtml(url);

        if (!fetchResult.ok) {
            console.error(`[GapFill] Fetch failed for ${monthStr} ${currentYear}: ${fetchResult.error}`);
            totalFailed++;
        } else {
            const rows = parseForexFactoryCalendar(fetchResult.html, currentYear);

            if (rows.length > 0) {
                // Map HTML rows to new schema format
                const eventsToUpsert = rows.map(row => {
                    const eventDay = row.eventDay;
                    const timeRaw = row.eventTimeRaw;
                    const startsAtUtc = (eventDay && timeRaw && !row.isAllDay && !row.isTentative)
                        ? parseForexFactoryTime(eventDay, timeRaw)
                        : null;

                    const isPredicted = !!row.forecast;

                    return {
                        source: 'forexfactory_live' as const,
                        sourceKey: buildEventFingerprint({
                            source: 'forexfactory_live',
                            eventDay,
                            eventTimeRaw: timeRaw,
                            currency: row.currency,
                            title: row.title,
                        }),
                        title: row.title,
                        currency: row.currency,
                        impact: normalizeImpact(row.impact),
                        eventDay,
                        eventTimeRaw: timeRaw,
                        startsAtUtc,
                        actual: row.actual || null,
                        forecast: row.forecast || null,
                        previous: row.previous || null,
                        revised: null,
                        detail: null,
                        description: null,
                        whyItMatters: null,
                        usualEffect: null,
                        frequency: null,
                        nextRelease: null,
                        ffUrl: null,
                        ffEventId: row.ffEventId,
                        status: row.actual ? 'released' as const : 'scheduled' as const,
                        isAllDay: row.isAllDay,
                        isTentative: row.isTentative,
                        isPredicted,
                        predictedAt: isPredicted ? new Date() : null,
                        predictionSource: isPredicted ? 'ff_historical_fill' : null,
                        lastSyncedAt: new Date(),
                        syncVersion: 1,
                        parserVersion: PARSER_VERSION,
                        rawPayload: row,
                        updatedAt: new Date(),
                    };
                });

                const result = await upsertEconomicEvents(eventsToUpsert as any);
                totalInserted += result.inserted;
                console.log(`[GapFill] Month ${monthStr} complete. Inserted ${result.inserted} rows`);
            }
            monthsProcessed++;
        }

        // Advance to next month
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }

        await sleep(4000); // Respectful throttle
    }

    await propagateDescriptions();

    await logSyncRun({
        jobType: 'gap_fill',
        source: 'forexfactory_live',
        startedAt,
        finishedAt: new Date(),
        status: totalFailed === 0 ? 'success' : 'partial',
        rowsSeen: totalInserted,
        rowsInserted: totalInserted,
        rowsUpdated: 0,
        errorMessage: totalFailed > 0 ? `${totalFailed} months failed` : null,
    });

    console.log('[GapFill] Full Complete');
    console.log(`  Months processed: ${monthsProcessed}`);
    console.log(`  Rows inserted:   ${totalInserted}`);
    console.log(`  Months failed:    ${totalFailed}`);
}