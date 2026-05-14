// src/modules/economic-calendar/ingestion/live/parseForexFactoryCalendar.ts
import * as cheerio from 'cheerio';

export interface ParsedCalendarRow {
    ffEventId: string | null;
    eventDay: string;
    eventTimeRaw: string;
    currency: string;
    impact: string;
    title: string;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
    isAllDay: boolean;
    isTentative: boolean;
}

export function parseForexFactoryCalendar(html: string, year: number): ParsedCalendarRow[] {
    const $ = cheerio.load(html);
    const rows: ParsedCalendarRow[] = [];

    let currentDayRaw = '';

    $('tr.calendar__row').each((_, el) => {
        const $row = $(el);
        const ffEventId = $row.attr('data-event-id') || null;

        // Date extraction
        const dayText = $row.find('.calendar__date').text().trim();
        if (dayText) {
            currentDayRaw = dayText; // e.g. "Apr 7"
        }

        const timeText = $row.find('.calendar__time').text().trim();
        const currency = $row.find('.calendar__currency').text().trim();
        const impactIcon = $row.find('.calendar__impact span').attr('class') || '';
        const title = $row.find('.calendar__event').text().trim();
        const actual = $row.find('.calendar__actual').text().trim();
        const forecast = $row.find('.calendar__forecast').text().trim();
        const previous = $row.find('.calendar__previous').text().trim();

        if (!currency || !title || !currentDayRaw) return;

        let impact = 'Low';
        if (impactIcon.includes('high')) impact = 'High';
        else if (impactIcon.includes('medium')) impact = 'Medium';

        const isAllDay = timeText.toLowerCase().includes('all day');
        const isTentative = timeText.toLowerCase().includes('tentative');

        // Combine day text with year: "Apr 7" + " 2025" -> "Apr 7 2025"
        const eventDay = `${currentDayRaw} ${year}`;

        rows.push({
            ffEventId,
            eventDay,
            eventTimeRaw: timeText,
            currency,
            impact,
            title,
            actual: actual || null,
            forecast: forecast || null,
            previous: previous || null,
            isAllDay,
            isTentative,
        });
    });

    return rows;
}
