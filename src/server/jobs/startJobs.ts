// src/server/jobs/startJobs.ts
// REPLACES the old fixed-interval approach entirely

import { scheduler } from '@/modules/economic-calendar/ingestion/jobs/smartScheduler';

let started = false;

export async function startCalendarJobs(): Promise<void> {
    if (started) {
        console.log('[Jobs] Already started');
        return;
    }

    started = true;
    await scheduler.start();
}

export function stopCalendarJobs(): void {
    scheduler.stop();
    started = false;
}

export function getSchedulerStatus() {
    return scheduler.getStatus();
}