// app/api/calendar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { economicEvents } from '@/modules/economic-calendar/db/economicEvents.schema';
import { and, gte, lte, asc, eq } from 'drizzle-orm';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { fetchEventDetail } from '@/modules/economic-calendar/ingestion/live/fetchEventDetail';
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const start = startParam ? new Date(startParam) : startOfDay(addDays(new Date(), -1));
  const end = endParam ? new Date(endParam) : endOfDay(addDays(start, 8));

  try {
    console.log(`[API] Fetching calendar events from ${start.toISOString()} to ${end.toISOString()}`);

    const events = await db.select()
      .from(economicEvents)
      .where(
        and(
          gte(economicEvents.startsAtUtc, start),
          lte(economicEvents.startsAtUtc, end)
        )
      )
      .orderBy(asc(economicEvents.startsAtUtc));

    // 3. Lazy Real Detail Fetching (Bypass demo data)
    const enriched = await Promise.all(events.map(async (event) => {
      // If we already have a description or detail, return it
      if (event.description || event.detail) {
        return event;
      }

      // If we have an FF Event ID, fetch the real detail live
      if (event.ffEventId) {
        try {
          console.log(`[API] Lazy fetching real details for "${event.title}" (${event.ffEventId})`);
          const realDetail = await fetchEventDetail(event.ffEventId);

          if (realDetail) {
            // Update the DB asynchronously so next time it's instant
            db.update(economicEvents)
              .set({
                description: realDetail.description,
                whyItMatters: realDetail.whyItMatters,
                usualEffect: realDetail.usualEffect,
                frequency: realDetail.frequency,
                nextRelease: realDetail.nextRelease,
                updatedAt: new Date(),
              })
              .where(eq(economicEvents.id, event.id))
              .execute();

            return {
              ...event,
              description: realDetail.description,
              whyItMatters: realDetail.whyItMatters,
              usualEffect: realDetail.usualEffect,
              frequency: realDetail.frequency,
              nextRelease: realDetail.nextRelease,
            };
          }
        } catch (err) {
          console.error(`[API] Failed to lazy fetch detail for ${event.id}:`, err);
        }
      }

      return event;
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Failed to fetch calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
