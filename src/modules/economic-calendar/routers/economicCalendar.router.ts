// src/modules/economic-calendar/routers/economicCalendar.router.ts
import { router, protectedProcedure } from '@/trpc/trpc';
import { db } from '@/db';
import { economicEventSyncRuns } from '../db/economicEvents.schema';
import { getSchedulerStatus } from '@/server/jobs/startJobs';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { fetchEventDescription } from '../services/fetchEventDescription';
import { economicEvents } from '@/modules/economic-calendar/db';

export const economicCalendarRouter = router({
    schedulerStatus: protectedProcedure
        .query(() => {
            return getSchedulerStatus();
        }),

    syncStatus: protectedProcedure
        .query(async () => {
            const lastRun = await db.query.economicEventSyncRuns.findFirst({
                orderBy: desc(economicEventSyncRuns.startedAt),
            });

            const lastSuccess = await db.query.economicEventSyncRuns.findFirst({
                where: eq(economicEventSyncRuns.status, 'success'),
                orderBy: desc(economicEventSyncRuns.startedAt),
            });

            const isStale = lastSuccess?.finishedAt
                ? Date.now() - lastSuccess.finishedAt.getTime() >
                2 * 60 * 60 * 1000
                : true;

            const schedulerStatus = getSchedulerStatus();

            return {
                lastRun,
                lastSuccess,
                isStale,
                scheduler: schedulerStatus,
            };
        }),

    // In economicCalendar.router.ts
    // Add this endpoint — called when user opens modal

    fetchDescription: protectedProcedure
        .input(z.object({
            eventId: z.string(),
            title: z.string(),
            currency: z.string(),
        }))
        .mutation(async ({ input }) => {
            // Check if we already have it
            const existing = await db.query.economicEvents.findFirst({
                where: eq(economicEvents.id, input.eventId),
                columns: { 
                    description: true, 
                    descriptionSource: true,
                    whyItMatters: true,
                    usualEffect: true,
                    frequency: true,
                },
            });

            if (existing?.description) {
                return { 
                    description: existing.description, 
                    whyItMatters: (existing as any).whyItMatters ?? null,
                    usualEffect: (existing as any).usualEffect ?? null,
                    frequency: (existing as any).frequency ?? null,
                    source: existing.descriptionSource ?? 'database',
                    sourceUrl: null,
                };
            }

            // Fetch fresh
            const result = await fetchEventDescription(
                input.title,
                input.currency
            );

            if (result.description) {
                // Save to DB for future use
                await db
                    .update(economicEvents)
                    .set({
                        description: result.description,
                        whyItMatters: result.whyItMatters,
                        usualEffect: result.usualEffect,
                        ffUrl: result.sourceUrl,
                        descriptionSource: result.source,
                        updatedAt: new Date(),
                    })
                    .where(eq(economicEvents.id, input.eventId));
            }

            return result;
        }),
});

