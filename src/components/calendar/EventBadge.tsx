// src/components/calendar/EventBadge.tsx
'use client';

import React from 'react';

type Impact = 'High' | 'Medium' | 'Low' | string;

interface EventBadgeProps {
  impact: Impact;
  className?: string;
}

export const EventBadge: React.FC<EventBadgeProps> = ({ impact, className = '' }) => {
  const getStyles = (imp: string) => {
    switch (imp?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50 dark:text-red-400';
      case 'medium':
        return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50 dark:text-orange-400';
      case 'low':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900/50 dark:text-yellow-400';
      case 'predicted':
        return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50 dark:text-purple-400';
      default:
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStyles(impact)} ${className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {impact || 'None'}
    </span>
  );
};
