'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { EventBadge } from './EventBadge';

interface EconomicEvent {
  id: string;
  title: string;
  currency: string;
  impact: string;
  startsAtUtc: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  revised: string | null;
  description: string | null;
  detail: string | null;
  descriptionSource: string | null;
  whyItMatters: string | null;
  usualEffect: string | null;
  frequency: string | null;
  status: string;
}

import { DescriptionSection } from './DescriptionSection';

export const EconomicCalendarWidget: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Keep viewMode and selectedDate in a single atomic state to prevent race conditions
  const [filter, setFilter] = useState<{ mode: 'day' | 'month' | 'year'; date: string }>({
    mode: 'day',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { mode: viewMode, date: selectedDate } = filter;

  const setModeAndDate = (mode: 'day' | 'month' | 'year', date: string) => {
    setFilter({ mode, date });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let start: Date;
        let end: Date;

        if (viewMode === 'year') {
          // date is "2026"
          const year = parseInt(selectedDate, 10);
          if (isNaN(year)) return;
          start = new Date(Date.UTC(year, 0, 1));
          end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        } else if (viewMode === 'month') {
          // date is "2026-05"
          const parts = selectedDate.split('-').map(Number);
          if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
          const [year, month] = parts;
          start = new Date(Date.UTC(year, month - 1, 1));
          end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        } else {
          // date is "2026-05-14"
          const parts = selectedDate.split('-').map(Number);
          if (parts.length < 3 || parts.some(isNaN)) return;
          const [year, month, day] = parts;
          start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
          end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        }

        const url = `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load calendar events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter]);

  const toggleExpand = (id: string, eventData: EconomicEvent) => {
    console.log('Expanding event:', eventData);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleQuickSelect = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setModeAndDate('day', format(d, 'yyyy-MM-dd'));
  };

  // Generate years from 2007 to 2026
  const years = Array.from({ length: 2026 - 2007 + 1 }, (_, i) => (2026 - i).toString());

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden flex flex-col h-full min-h-[600px]">
      <div className="flex flex-col border-b border-zinc-100 p-6 dark:border-zinc-900 gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Economic Calendar
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Search historical data (2007-present) or live market events</p>
        </div>
        
        {/* Advanced Single-Select Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
           
           <div className="flex items-center gap-3">
             <div className="flex flex-col">
               <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1">View By</label>
               <select 
                 value={viewMode}
                 onChange={(e) => {
                   const mode = e.target.value as 'day' | 'month' | 'year';
                   const now = new Date();
                   if (mode === 'day') setModeAndDate('day', format(now, 'yyyy-MM-dd'));
                   else if (mode === 'month') setModeAndDate('month', format(now, 'yyyy-MM'));
                   else setModeAndDate('year', format(now, 'yyyy'));
                 }}
                 className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
               >
                 <option value="day">Single Day</option>
                 <option value="month">Full Month</option>
                 <option value="year">Full Year</option>
               </select>
             </div>

             <div className="flex flex-col">
               <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Select Date</label>
               {viewMode === 'day' && (
                 <input 
                   type="date" 
                   value={selectedDate}
                   onChange={(e) => setModeAndDate('day', e.target.value)}
                   className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px]"
                 />
               )}
               {viewMode === 'month' && (
                 <input 
                   type="month" 
                   value={selectedDate}
                   onChange={(e) => setModeAndDate('month', e.target.value)}
                   className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px]"
                 />
               )}
               {viewMode === 'year' && (
                 <select 
                   value={selectedDate}
                   onChange={(e) => setModeAndDate('year', e.target.value)}
                   className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px]"
                 >
                   {years.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
               )}
             </div>
           </div>

           {/* Quick Selects */}
           <div className="flex items-center gap-2">
             <button onClick={() => handleQuickSelect(0)} className="px-4 py-2 bg-white dark:bg-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">Today</button>
             <button onClick={() => handleQuickSelect(1)} className="px-4 py-2 bg-white dark:bg-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">Tomorrow</button>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 relative">
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
             <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-800 dark:border-t-zinc-200" />
           </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
             <p className="text-red-500 font-medium">{error}</p>
           </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:bg-zinc-900/50 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Impact</th>
                <th className="px-6 py-4 text-right">Actual</th>
                <th className="px-6 py-4 text-right">Forecast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">📭</span>
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                        No events found for{' '}
                        {(() => {
                          const parts = selectedDate.split('-').map(Number);
                          try {
                            if (viewMode === 'day') {
                              const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                              return format(d, 'MMMM d, yyyy');
                            }
                            if (viewMode === 'month') {
                              const d = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
                              return format(d, 'MMMM yyyy');
                            }
                            return selectedDate;
                          } catch (e) {
                            return selectedDate;
                          }
                        })()}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-sm leading-relaxed">
                        Historical data for past dates may not be imported yet. You can fill this "data gap" by running the following commands in your terminal:
                      </p>
                      <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
                        <div className="space-y-1">
                          <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-lg font-mono text-[10px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 block">
                            npm run calendar:gap
                          </code>
                          <p className="text-[10px] text-zinc-400 pl-1">
                            • Imports core event data (Time, Currency, Impact, Actuals)
                          </p>
                        </div>
                        <div className="space-y-1">
                          <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded-lg font-mono text-[10px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 block">
                            npm run calendar:backfill-descriptions
                          </code>
                          <p className="text-[10px] text-zinc-400 pl-1">
                            • Fetches event descriptions and "Why Traders Care" analysis
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr
                      onClick={() => toggleExpand(event.id, event)}
                      className={`group cursor-pointer transition-colors ${expandedId === event.id
                          ? 'bg-zinc-50 dark:bg-zinc-900'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30'
                        }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {event.startsAtUtc ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{format(new Date(event.startsAtUtc), 'MMM dd, yyyy')}</span>
                            <span>{format(new Date(event.startsAtUtc), 'HH:mm')}</span>
                          </div>
                        ) : 'All Day'}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="w-8">{event.currency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {event.title}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <EventBadge impact={event.impact} />
                          {event.status === 'predicted' && (
                            <EventBadge impact="predicted" />
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${event.actual ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-300 dark:text-zinc-700'
                        }`}>
                        {event.actual || '--'}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-500 font-medium">
                        {event.forecast || '--'}
                      </td>
                    </tr>

                    {expandedId === event.id && (
                      <tr>
                        <td colSpan={6} className="bg-zinc-50/80 dark:bg-zinc-900/50 px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-4">
                              <DescriptionSection
                                eventId={event.id}
                                title={event.title}
                                currency={event.currency}
                                existingDescription={event.description || event.detail}
                                descriptionSource={event.descriptionSource}
                                isUpcoming={new Date(event.startsAtUtc) > new Date()}
                              />
                            </div>

                            <div className="space-y-6">
                              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
                                <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-3">Event Details</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Frequency</span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{event.frequency || 'Monthly'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Usual Effect</span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 italic">{event.usualEffect || 'Varies'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Previous</span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{event.previous || '--'}</span>
                                  </div>
                                  {event.revised && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500 font-medium text-orange-500">Revised From</span>
                                      <span className="font-semibold text-orange-600 dark:text-orange-400">{event.revised}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
