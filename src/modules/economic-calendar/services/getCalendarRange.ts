// src/modules/economic-calendar/services/getCalendarRange.ts
import { db } from '@/db';
import { economicEvents } from '../db/economicEvents.schema';
import { and, gte, lte, asc } from 'drizzle-orm';

export async function getCalendarRange(start: Date, end: Date) {
  return await db.query.economicEvents.findMany({
    where: and(
      gte(economicEvents.startsAtUtc, start),
      lte(economicEvents.startsAtUtc, end)
    ),
    orderBy: [asc(economicEvents.startsAtUtc)],
  });
}
