import { db } from './src/db';
import { economicEvents } from './src/modules/economic-calendar/db/economicEvents.schema';
import { and, gte, lte } from 'drizzle-orm';

const start = new Date('2026-05-07T00:00:00Z');
const end = new Date('2026-05-07T23:59:59Z');

db.select()
  .from(economicEvents)
  .where(and(gte(economicEvents.startsAtUtc, start), lte(economicEvents.startsAtUtc, end)))
  .then(r => {
    console.log(`Found ${r.length} events`);
    console.log(JSON.stringify(r.map(e => ({ title: e.title, startsAtUtc: e.startsAtUtc })), null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
