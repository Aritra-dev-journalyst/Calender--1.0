// src/modules/economic-calendar/ingestion/jobs/smartScheduler.ts

import { db } from '@/db';
import { economicEvents } from '../../db';
import { and, gte, isNotNull, asc } from 'drizzle-orm';
import { runForwardSync } from './runForwardSync';
import { logSyncRun } from './logSyncRun';
import { sendAlert } from './alerts';

type ScheduledTimer = {
    eventId: string;
    eventTitle: string;
    eventTime: Date;
    preEventTimer: NodeJS.Timeout | null;
    postEventTimer: NodeJS.Timeout | null;
};

class SmartCalendarScheduler {
    private baselineTimer: NodeJS.Timeout | null = null;
    private currentSchedule: ScheduledTimer | null = null;
    private isRunning = false;

    // Config
    private readonly PRE_EVENT_OFFSET_MS = 2 * 60 * 1000;   // 2 min before
    private readonly POST_EVENT_OFFSET_MS = 5 * 60 * 1000;  // 5 min after
    private readonly BASELINE_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
    private readonly MIN_SCHEDULE_AHEAD_MS = 30 * 1000;     // 30 sec minimum

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[Scheduler] Already running');
            return;
        }

        this.isRunning = true;
        console.log('[Scheduler] Starting smart calendar scheduler');

        // 1. Run initial sync immediately
        await this.runSync('startup');

        // 2. Schedule around next event
        await this.scheduleNextEvent();

        // 3. Start baseline safety sync
        this.startBaselineSync();
    }

    stop(): void {
        this.isRunning = false;

        if (this.baselineTimer) {
            clearInterval(this.baselineTimer);
            this.baselineTimer = null;
        }

        if (this.currentSchedule) {
            if (this.currentSchedule.preEventTimer) {
                clearTimeout(this.currentSchedule.preEventTimer);
            }
            if (this.currentSchedule.postEventTimer) {
                clearTimeout(this.currentSchedule.postEventTimer);
            }
            this.currentSchedule = null;
        }

        console.log('[Scheduler] Stopped');
    }

    // ── Core scheduling logic ────────────────────────────────

    private async scheduleNextEvent(): Promise<void> {
        const nextEvent = await this.findNextEvent();

        if (!nextEvent) {
            console.log(
                '[Scheduler] No upcoming events found — will retry in 1 hour'
            );
            setTimeout(
                () => this.scheduleNextEvent(),
                60 * 60 * 1000
            );
            return;
        }

        const now = Date.now();
        const eventTime = nextEvent.startsAtUtc.getTime();
        const preEventTime = eventTime - this.PRE_EVENT_OFFSET_MS;
        const postEventTime = eventTime + this.POST_EVENT_OFFSET_MS;

        console.log(
            `[Scheduler] Next event: "${nextEvent.title}" ` +
            `(${nextEvent.currency}) at ` +
            `${nextEvent.startsAtUtc.toISOString()}`
        );

        // Clear any existing schedule
        this.clearCurrentSchedule();

        this.currentSchedule = {
            eventId: nextEvent.id,
            eventTitle: nextEvent.title,
            eventTime: nextEvent.startsAtUtc,
            preEventTimer: null,
            postEventTimer: null,
        };

        // Schedule pre-event sync
        const msUntilPre = preEventTime - now;

        if (msUntilPre > this.MIN_SCHEDULE_AHEAD_MS) {
            console.log(
                `[Scheduler] Pre-event sync in ${formatMs(msUntilPre)}`
            );

            this.currentSchedule.preEventTimer = setTimeout(
                async () => {
                    console.log(
                        `[Scheduler] PRE-EVENT sync for: ${nextEvent.title}`
                    );
                    await this.runSync(
                        `pre_event:${nextEvent.title}:${nextEvent.id}`
                    );
                },
                msUntilPre
            );
        } else {
            console.log(
                '[Scheduler] Pre-event time already passed — skipping pre-sync'
            );
        }

        // Schedule post-event sync
        const msUntilPost = postEventTime - now;

        if (msUntilPost > 0) {
            console.log(
                `[Scheduler] Post-event sync in ${formatMs(msUntilPost)}`
            );

            this.currentSchedule.postEventTimer = setTimeout(
                async () => {
                    console.log(
                        `[Scheduler] POST-EVENT sync for: ${nextEvent.title}`
                    );
                    await this.runSync(
                        `post_event:${nextEvent.title}:${nextEvent.id}`
                    );

                    // After post-event sync, schedule the NEXT event
                    console.log(
                        '[Scheduler] Rescheduling for next upcoming event...'
                    );
                    await this.scheduleNextEvent();
                },
                msUntilPost
            );
        }
    }

    private startBaselineSync(): void {
        // Safety net — syncs every 2 hours regardless
        this.baselineTimer = setInterval(async () => {
            console.log('[Scheduler] Baseline sync running...');
            await this.runSync('baseline_2hr');

            // Refresh the event schedule after baseline sync
            // (new events may have been added to the feed)
            this.clearCurrentSchedule();
            await this.scheduleNextEvent();
        }, this.BASELINE_INTERVAL_MS);
    }

    // ── Database queries ─────────────────────────────────────

    private async findNextEvent(): Promise<{
        id: string;
        title: string;
        currency: string | null;
        impact: string | null;
        startsAtUtc: Date;
    } | null> {
        // Look ahead 2 minutes from now to avoid immediately past events
        const lookAheadFrom = new Date(
            Date.now() + this.MIN_SCHEDULE_AHEAD_MS
        );

        const result = await db.query.economicEvents.findFirst({
            where: and(
                isNotNull(economicEvents.startsAtUtc),
                gte(economicEvents.startsAtUtc, lookAheadFrom)
            ),
            orderBy: asc(economicEvents.startsAtUtc),
            columns: {
                id: true,
                title: true,
                currency: true,
                impact: true,
                startsAtUtc: true,
            },
        });

        if (!result?.startsAtUtc) return null;

        return {
            id: result.id,
            title: result.title,
            currency: result.currency,
            impact: result.impact,
            startsAtUtc: result.startsAtUtc,
        };
    }

    // ── Sync execution ───────────────────────────────────────

    private async runSync(reason: string): Promise<void> {
        console.log(`[Scheduler] Running sync — reason: ${reason}`);

        try {
            const nextScheduledAt = await this.getNextEventTime();
            await runForwardSync({ triggerReason: reason, nextScheduledAt });
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Unknown error';
            console.error(`[Scheduler] Sync failed: ${msg}`);

            await sendAlert('critical', 'Scheduled sync failed', {
                reason,
                error: msg,
            });
        }
    }

    private async getNextEventTime(): Promise<Date | null> {
        const next = await this.findNextEvent();
        return next?.startsAtUtc ?? null;
    }

    // ── Helpers ──────────────────────────────────────────────

    private clearCurrentSchedule(): void {
        if (!this.currentSchedule) return;

        if (this.currentSchedule.preEventTimer) {
            clearTimeout(this.currentSchedule.preEventTimer);
        }
        if (this.currentSchedule.postEventTimer) {
            clearTimeout(this.currentSchedule.postEventTimer);
        }

        this.currentSchedule = null;
    }

    // ── Status (for API/UI) ──────────────────────────────────

    getStatus(): {
        isRunning: boolean;
        nextEvent: {
            title: string;
            time: Date;
        } | null;
    } {
        return {
            isRunning: this.isRunning,
            nextEvent: this.currentSchedule
                ? {
                    title: this.currentSchedule.eventTitle,
                    time: this.currentSchedule.eventTime,
                }
                : null,
        };
    }
}

// Singleton instance
export const scheduler = new SmartCalendarScheduler();

// Format milliseconds as human readable
function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    return minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;
}