// src/modules/economic-calendar/utils/timezone.ts

import { fromZonedTime } from 'date-fns-tz';
import { FF_TIMEZONE } from '../domain/constants';

export function parseForexFactoryTime(
    eventDay: string,
    timeRaw: string
): Date | null {
    try {
        if (!eventDay || !timeRaw) return null;
        if (timeRaw === 'All Day' || timeRaw === 'Tentative') return null;

        const time24 = convertTo24Hour(timeRaw);
        if (!time24) return null;

        // Normalize the date part to YYYY-MM-DD
        const normalizedDay = normalizeDay(eventDay);
        if (!normalizedDay) return null;

        const dateTimeStr = `${normalizedDay} ${time24}`;
        const result = fromZonedTime(dateTimeStr, FF_TIMEZONE);

        if (isNaN(result.getTime())) return null;

        return result;
    } catch {
        return null;
    }
}

function convertTo24Hour(timeStr: string): string | null {
    const cleaned = timeStr.trim().toLowerCase().replace(/\s/g, '');

    // Format: "8:30am", "8:30pm", "12:00am"
    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = ampmMatch[2];
        const period = ampmMatch[3];

        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;

        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    // Format: "08:30" or "8:30"
    const plainMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (plainMatch) {
        return `${plainMatch[1].padStart(2, '0')}:${plainMatch[2]}`;
    }

    return null;
}

function normalizeDay(raw: string): string | null {
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // Try native Date parse for formats like "Jun 4, 2025"
    try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
        }
    } catch { }

    return null;
}