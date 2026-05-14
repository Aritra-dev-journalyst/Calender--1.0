// src/modules/economic-calendar/ingestion/jobs/logSyncRun.ts
// UPDATED — accepts new fields

import { db } from '@/db';
import { economicEventSyncRuns } from '../../db';

export async function logSyncRun(data: {
    jobType: string;
    source: string;
    startedAt: Date;
    finishedAt: Date;
    status: 'success' | 'failed' | 'partial';
    rowsSeen: number;
    rowsInserted: number;
    rowsUpdated: number;
    errorMessage: string | null;
    triggerReason?: string;
    nextScheduledAt?: Date | null;
}): Promise<void> {
    try {
        await db.insert(economicEventSyncRuns).values({
            jobType: data.jobType,
            source: data.source,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            status: data.status,
            rowsSeen: data.rowsSeen,
            rowsInserted: data.rowsInserted,
            rowsUpdated: data.rowsUpdated,
            errorMessage: data.errorMessage,
            triggerReason: data.triggerReason ?? null,
            nextScheduledAt: data.nextScheduledAt ?? null,
        });
    } catch (err) {
        console.error('[logSyncRun] Failed:', err);
    }
}