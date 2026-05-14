// src/modules/economic-calendar/utils/eventFingerprint.ts

import crypto from 'node:crypto';

export function buildEventFingerprint(input: {
    source: string;
    eventDay: string | null;
    eventTimeRaw: string | null;
    currency: string | null;
    title: string;
}): string {
    const raw = [
        input.source,
        input.eventDay ?? '',
        input.eventTimeRaw ?? '',
        input.currency ?? '',
        input.title.trim().toLowerCase(),
    ].join('|');

    return crypto
        .createHash('sha256')
        .update(raw)
        .digest('hex');
}