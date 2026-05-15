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

    const events = await db.select()
      .from(economicEvents)
      .where(
        and(
          gte(economicEvents.startsAtUtc, start),
          lte(economicEvents.startsAtUtc, end)
        )
      )
      .orderBy(asc(economicEvents.startsAtUtc));

    // Lazy Real Detail Fetching — runs when nextRelease is missing
    const enriched = await Promise.all(events.map(async (event) => {
      // Skip lazy fetch if we already have all fields populated
      if ((event.description || event.detail) && event.nextRelease) {
        return event;
      }

      // If we have an FF Event ID, fetch missing fields
      if (event.ffEventId) {
        try {
          const realDetail = await fetchEventDetail(event.ffEventId);

          if (realDetail) {
            // Build update — only overwrite null fields (preserve existing data)
            const updateFields: Record<string, unknown> = {
              nextRelease: realDetail.nextRelease,
              updatedAt: new Date(),
            };
            if (!event.description && !event.detail) {
              updateFields.description = realDetail.description;
              updateFields.whyItMatters = realDetail.whyItMatters;
              updateFields.usualEffect = realDetail.usualEffect;
              updateFields.frequency = realDetail.frequency;
            }

            // Save to DB asynchronously so next request is instant
            db.update(economicEvents)
              .set(updateFields)
              .where(eq(economicEvents.id, event.id))
              .execute();

            return {
              ...event,
              nextRelease: realDetail.nextRelease,
              ...((!event.description && !event.detail) ? {
                description: realDetail.description,
                whyItMatters: realDetail.whyItMatters,
                usualEffect: realDetail.usualEffect,
                frequency: realDetail.frequency,
              } : {}),
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
