// app/page.tsx
export const dynamic = 'force-dynamic';

import { EconomicCalendarWidget } from '@/components/calendar/EconomicCalendarWidget';
import { UpcomingEventsCard } from '@/components/calendar/UpcomingEventsCard';
import { NearbyEventsPanel } from '@/components/calendar/NearbyEventsPanel';
import { db } from '@/db';
import { economicEvents } from '@/modules/economic-calendar/db/economicEvents.schema';
import { and, gte, lte, asc, isNotNull, eq } from 'drizzle-orm';
import { calculateDailySentiment } from '@/modules/economic-calendar/services/calculateSentiment';

export default async function Home() {
  const now = new Date();
  // 1. Fetch the next High Impact event specifically for the "Next Major Release" card
  const nextMajorEventRaw = await db.select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.startsAtUtc, now),
        eq(economicEvents.impact, 'high')
      )
    )
    .orderBy(asc(economicEvents.startsAtUtc))
    .limit(1);

  // 2. Fetch general upcoming events for the "Coming Up Next" list
  const upcomingEventsRaw = await db.select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.startsAtUtc, now)
      )
    )
    .orderBy(asc(economicEvents.startsAtUtc))
    .limit(10);

  // Serialize dates for Client Components
  const upcomingEvents = upcomingEventsRaw.map(e => ({
    ...e,
    startsAtUtc: e.startsAtUtc?.toISOString() || ''
  }));

  // Logic: Use High Impact event if found, otherwise fallback to the first upcoming event
  let nextMajorEvent = null;
  if (nextMajorEventRaw.length > 0) {
    nextMajorEvent = {
      ...nextMajorEventRaw[0],
      startsAtUtc: nextMajorEventRaw[0].startsAtUtc?.toISOString() || ''
    };
  } else if (upcomingEvents.length > 0) {
    nextMajorEvent = upcomingEvents[0];
  }



  // Fetch today's completed events to calculate sentiment
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const todaysCompletedEvents = await db.select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.startsAtUtc, startOfToday),
        lte(economicEvents.startsAtUtc, endOfToday),
        isNotNull(economicEvents.actual)
      )
    );

  const sentiment = calculateDailySentiment(todaysCompletedEvents);

  let sColor = { text: 'text-zinc-500', textDark: 'dark:text-zinc-400', fill: 'bg-zinc-500', bgFade: 'bg-zinc-500/10', borderFade: 'border-zinc-500/10' };
  if (sentiment.label === 'BULLISH') sColor = { text: 'text-emerald-500', textDark: 'dark:text-emerald-400', fill: 'bg-emerald-500', bgFade: 'bg-emerald-500/10', borderFade: 'border-emerald-500/10' };
  if (sentiment.label === 'BEARISH') sColor = { text: 'text-red-500', textDark: 'dark:text-red-400', fill: 'bg-red-500', bgFade: 'bg-red-500/10', borderFade: 'border-red-500/10' };

  const dashOffset = 251.2 * (1 - sentiment.score / 100);


  const nearbyEvents = upcomingEvents.filter(e => e.id !== nextMajorEvent?.id).slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Trading Dashboard
            </h1>
            <p className="text-lg text-zinc-500 font-medium">
              Real-time economic indicators and market events
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-500/20">
              LIVE SYNC ACTIVE
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Content (Calendar) */}
          <div className="lg:col-span-8 space-y-8">
            <EconomicCalendarWidget />
          </div>

          {/* Sidebar (Next Up & Nearby) */}
          <div className="lg:col-span-4 space-y-10">

            {nextMajorEvent && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-1">Next Major Release</h3>
                <UpcomingEventsCard event={nextMajorEvent as any} />
              </div>
            )}

            <NearbyEventsPanel events={nearbyEvents as any} title="Coming Up Next" />

            {/* Quick Stats Card: Premium Sentiment Gauge */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-48 h-48 ${sColor.bgFade} rounded-full -mr-20 -mt-20 blur-3xl transition-opacity opacity-50 group-hover:opacity-100`} />

              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">Daily Sentiment</h4>

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className={`text-5xl font-black tracking-tighter ${sColor.text} leading-[0.9] py-1`}>
                    {sentiment.label}
                  </div>
                  <div className={`flex items-center gap-2 py-1.5 px-3 ${sColor.bgFade} rounded-xl border ${sColor.borderFade} w-fit`}>
                    {sentiment.totalIndicators > 0 ? (
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sColor.fill} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${sColor.fill}`}></span>
                      </span>
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className={`relative inline-flex rounded-full h-2 w-2 bg-zinc-400`}></span>
                      </span>
                    )}
                    <span className={`text-[10px] font-bold ${sColor.text} ${sColor.textDark} uppercase tracking-widest`}>
                      {sentiment.totalIndicators} Indicators
                    </span>
                  </div>
                </div>

                <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                  {/* SVG Gauge */}
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    {/* Progress Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      className={`${sColor.text} transition-all duration-1000 ease-out shadow-lg`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{sentiment.score}%</span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">Bullish</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sentiment Scale</span>
                  <span className={`text-[10px] font-bold ${sColor.text} uppercase tracking-widest`}>
                    {sentiment.label === 'BULLISH' ? 'Bullish Bias' : sentiment.label === 'BEARISH' ? 'Bearish Bias' : 'Neutral Bias'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 h-1.5 mb-2">
                  {/* Bearish Segment */}
                  <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className={`h-full w-full ${sentiment.label === 'BEARISH' ? 'bg-red-500' : 'bg-transparent'}`} />
                  </div>
                  {/* Neutral Segment */}
                  <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className={`h-full w-full ${sentiment.label === 'NEUTRAL' ? 'bg-zinc-500' : 'bg-transparent'}`} />
                  </div>
                  {/* Bullish Segment */}
                  <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className={`h-full w-full ${sentiment.label === 'BULLISH' ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                </div>
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter text-zinc-400">
                  <span className={sentiment.label === 'BEARISH' ? 'text-red-500' : ''}>Bearish</span>
                  <span className={sentiment.label === 'NEUTRAL' ? 'text-zinc-500' : ''}>Neutral</span>
                  <span className={sentiment.label === 'BULLISH' ? 'text-emerald-500' : ''}>Bullish</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
