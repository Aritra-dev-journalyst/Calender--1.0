// src/components/calendar/UpcomingEventsCard.tsx
'use client';

import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { EventBadge } from './EventBadge';

interface EconomicEvent {
  id: string;
  title: string;
  currency: string;
  impact: string;
  startsAtUtc: string | Date;
  forecast: string | null;
  previous: string | null;
}

interface UpcomingEventsCardProps {
  event: EconomicEvent;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({ event }) => {
  const startTime = new Date(event.startsAtUtc);
  
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{event.currency}</span>
            <EventBadge impact={event.impact} />
          </div>
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 line-clamp-1">{event.title}</h3>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-50">
            {format(startTime, 'HH:mm')}
          </div>
          <div className="text-xs text-zinc-500">
            in {formatDistanceToNow(startTime)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Forecast</span>
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{event.forecast || '--'}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Previous</span>
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{event.previous || '--'}</div>
        </div>
      </div>
    </div>
  );
};
