// src/components/calendar/NearbyEventsPanel.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import { EventBadge } from './EventBadge';

interface EconomicEvent {
  id: string;
  title: string;
  currency: string;
  impact: string;
  startsAtUtc: string | Date;
  actual: string | null;
}

interface NearbyEventsPanelProps {
  events: EconomicEvent[];
  title?: string;
}

export const NearbyEventsPanel: React.FC<NearbyEventsPanelProps> = ({ events, title = "Nearby Events" }) => {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-1">{title}</h2>
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-200 rounded-xl dark:border-zinc-800">
            No events in the immediate window
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-xs font-mono font-bold text-zinc-500 w-10">
                  {format(new Date(event.startsAtUtc), 'HH:mm')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{event.currency}</span>
                    <EventBadge impact={event.impact} className="scale-75 origin-left" />
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate max-w-[150px]">{event.title}</div>
                </div>
              </div>
              <div className="text-right">
                {event.actual ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{event.actual}</span>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-400">WAITING</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
