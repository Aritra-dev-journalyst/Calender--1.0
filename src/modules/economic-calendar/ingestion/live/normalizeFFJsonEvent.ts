// src/modules/economic-calendar/ingestion/live/normalizeFFJsonEvent.ts
// FIXED FILE

import { buildEventFingerprint } from '../../utils/eventFingerprint';
import { normalizeImpact } from '../../utils/impact';
import { PARSER_VERSION } from '../../domain/constants';

export type FFJsonEvent = {
    title: string;
    country: string;
    date: string;    // Can be "MM-DD-YYYY" OR "2026-05-15T08:30:00-04:00"
    time?: string;
    impact: string;
    forecast: string;
    previous: string;
    actual?: string;
};

export function normalizeFFJsonEvent(
    event: FFJsonEvent,
    options: {
        isPredicted?: boolean;
        predictionSource?: string;
    } = {}
) {
    // Handle BOTH date formats from the feed
    const { eventDay, startsAtUtc } = parseDateField(event.date);

    const timeRaw = event.time?.trim() || null;
    const currency = event.country?.trim() || null;
    const title = event.title?.trim() || '';

    const isAllDay = timeRaw === 'All Day';
    const isTentative = timeRaw === 'Tentative';

    const now = new Date();
    const isFutureEvent = startsAtUtc ? startsAtUtc > now : false;
    const isPredicted =
        options.isPredicted ??
        (isFutureEvent && !!event.forecast?.trim());

    const sourceKey = buildEventFingerprint({
        source: 'forexfactory_live',
        eventDay,
        eventTimeRaw: timeRaw ?? (startsAtUtc?.toISOString().slice(11, 16) ?? null),
        currency,
        title,
    });

    return {
        source: 'forexfactory_live' as const,
        sourceKey,
        title,
        currency,
        impact: normalizeImpact(event.impact),
        eventDay,
        eventTimeRaw: timeRaw ?? startsAtUtc?.toISOString().slice(11, 16) ?? null,
        startsAtUtc,
        actual: clean(event.actual),
        forecast: clean(event.forecast),
        previous: clean(event.previous),
        revised: null,
        detail: null,
        description: null,
        whyItMatters: null,
        usualEffect: null,
        frequency: null,
        nextRelease: null,
        ffUrl: null,
        status: (clean(event.actual)
            ? 'released'
            : 'scheduled') as 'released' | 'scheduled',
        isAllDay,
        isTentative,
        isPredicted,
        predictedAt: isPredicted ? now : null,
        predictionSource: isPredicted
            ? (options.predictionSource ?? 'ff_json_feed')
            : null,
        lastSyncedAt: now,
        syncVersion: 1,
        parserVersion: PARSER_VERSION,
        rawPayload: event,
        updatedAt: now,
    };
}

// ── Date parsing — handles both formats ─────────────────────

function parseDateField(raw: string): {
    eventDay: string | null;
    startsAtUtc: Date | null;
} {
    if (!raw) return { eventDay: null, startsAtUtc: null };

    // Format 1: ISO 8601 with timezone offset
    // "2026-05-15T08:30:00-04:00"
    if (raw.includes('T')) {
        try {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
                return {
                    eventDay: d.toISOString().slice(0, 10),
                    startsAtUtc: d,
                };
            }
        } catch { }
    }

    // Format 2: "MM-DD-YYYY"
    // "05-15-2026"
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
        const [mm, dd, yyyy] = raw.split('-');
        const eventDay = `${yyyy}-${mm}-${dd}`;
        return {
            eventDay,
            startsAtUtc: null, // time parsed separately
        };
    }

    // Format 3: "YYYY-MM-DD"
    // "2026-05-15"
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return {
            eventDay: raw,
            startsAtUtc: null,
        };
    }

    // Fallback: try native Date parse
    try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
            return {
                eventDay: d.toISOString().slice(0, 10),
                startsAtUtc: d,
            };
        }
    } catch { }

    return { eventDay: null, startsAtUtc: null };
}

function clean(val: string | undefined | null): string | null {
    if (!val || val.trim() === '') return null;
    return val.trim();
}