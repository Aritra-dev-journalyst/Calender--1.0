import * as cheerio from 'cheerio';
import { fetchForexFactoryHtml } from './fetchForexFactoryHtml';
import { FF_BASE_URL } from '../../domain/constants';

export interface EventDetail {
    description: string | null;
    whyItMatters: string | null;
    usualEffect: string | null;
    frequency: string | null;
    nextRelease: string | null;
}

/**
 * Fetches the deep detail page for a specific Forex Factory event ID
 * Example URL: https://www.forexfactory.com/calendar?detail=145942
 */
export async function fetchEventDetail(ffEventId: string): Promise<EventDetail | null> {
    if (!ffEventId) return null;

    const url = `${FF_BASE_URL}/calendar?detail=${ffEventId}`;
    console.log(`[FF-Detail] Fetching: ${url}`);

    const result = await fetchForexFactoryHtml(url);
    if (!result.ok) {
        console.error(`[FF-Detail] Fetch failed: ${result.error}`);
        return null;
    }

    const $ = cheerio.load(result.html);
    const detail: EventDetail = {
        description: null,
        whyItMatters: null,
        usualEffect: null,
        frequency: null,
        nextRelease: null
    };

    // Forex Factory detail pages use a table with .calendar__spec class
    $('.calendar__spec').each((_, el) => {
        const title = $(el).find('.calendar__spec-title').text().toLowerCase().trim();
        const value = $(el).find('.calendar__spec-contents').text().trim();

        if (title.includes('source') || title.includes('measures')) {
            detail.description = value;
        } else if (title.includes('why traders care') || title.includes('why it matters')) {
            detail.whyItMatters = value;
        } else if (title.includes('usual effect')) {
            detail.usualEffect = value;
        } else if (title.includes('frequency')) {
            detail.frequency = value;
        } else if (title.includes('next release')) {
            detail.nextRelease = value;
        }
    });

    // Fallback: If description is still null, look for the first block of text in specs
    if (!detail.description) {
        detail.description = $('.calendar__spec-contents').first().text().trim() || null;
    }

    return detail;
}
