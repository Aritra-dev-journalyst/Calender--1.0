// src/app/(journal)/calendar/_components/DescriptionSection.tsx
// Fetches description on-demand when modal opens

'use client';

import { api } from '@/trpc/react';
import { useState } from 'react';

interface Props {
    eventId: string;
    title: string;
    currency: string;
    existingDescription: string | null;
    descriptionSource: string | null;
    isUpcoming: boolean;
}

export function DescriptionSection({
    eventId,
    title,
    currency,
    existingDescription,
    descriptionSource,
    isUpcoming,
}: Props) {
    const [fetchTriggered, setFetchTriggered] = useState(false);

    const fetchDesc = api.economicCalendar.fetchDescription.useMutation();

    // Auto-fetch if no description exists
    useState(() => {
        if (!existingDescription && !fetchTriggered) {
            setFetchTriggered(true);
            fetchDesc.mutate({ eventId, title, currency });
        }
    });

    const description =
        fetchDesc.data?.description ?? existingDescription;

    const source =
        fetchDesc.data
            ? (fetchDesc.data as any).source
            : descriptionSource;

    // Loading state
    if (fetchDesc.isPending) {
        return (
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Description
                </h3>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                    <div className="h-4 bg-muted rounded w-4/6" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Fetching description...
                </p>
            </div>
        );
    }

    // No description found
    if (!description) {
        return (
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Description
                </h3>
                <div className="rounded-xl bg-muted/30 border border-dashed p-5 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {isUpcoming
                            ? 'No description found for this event.'
                            : 'No description available.'}
                    </p>
                    <button
                        onClick={() =>
                            fetchDesc.mutate({ eventId, title, currency })
                        }
                        className="text-xs text-primary underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                </h3>

                {/* Source label */}
                <SourceLabel
                    source={source}
                    isUpcoming={isUpcoming}
                />
            </div>

            {/* Disclaimer for upcoming */}
            {isUpcoming && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
                    <span className="shrink-0">ℹ️</span>
                    <span>
                        This explains what {title} measures.
                        Release-specific commentary appears after the event publishes.
                    </span>
                </div>
            )}

            <p className="text-sm leading-relaxed">{description}</p>

            {/* Why It Matters */}
            {fetchDesc.data?.whyItMatters && (
                <div className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Why It Matters
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {fetchDesc.data.whyItMatters}
                    </p>
                </div>
            )}

            {/* Usual Effect */}
            {fetchDesc.data?.usualEffect && (
                <div className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Usual Effect
                    </h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed italic">
                        {fetchDesc.data.usualEffect}
                    </p>
                </div>
            )}
        </div>
    );
}

function SourceLabel({
    source,
    isUpcoming,
}: {
    source: string | null;
    isUpcoming: boolean;
}) {
    if (!source) return null;

    const labels: Record<string, string> = {
        wikipedia: '📖 Wikipedia',
        investing_com: '📊 Investing.com',
        forexfactory: '🏭 Forex Factory',
        ehsan_historical: '📂 Historical data',
        inherited: '🔄 From past releases',
        backfill: '🔄 Auto-filled',
    };

    return (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {labels[source] ?? source}
        </span>
    );
}