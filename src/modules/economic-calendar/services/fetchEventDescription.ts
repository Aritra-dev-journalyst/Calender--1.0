// src/modules/economic-calendar/services/fetchEventDescription.ts
import * as cheerio from 'cheerio';
import { 
    detectEventType, 
    getStaticEventDescription,
    type EventType
} from '../utils/eventDescriptions';

export type FetchedDescription = {
    description: string | null;
    whyItMatters: string | null;
    usualEffect: string | null;
    frequency: string | null;
    source: string | null;
    sourceUrl: string | null;
    eventType: EventType;
};

export type { EventType };

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

const randomSleep = (min: number, max: number) =>
    sleep(Math.floor(Math.random() * (max - min + 1) + min));

// ── Main function ─────────────────────────────────────────────

export async function fetchEventDescription(
    title: string,
    currency: string
): Promise<FetchedDescription> {
    const eventType = detectEventType(title);

    // Handle non-data events with static descriptions
    const staticResult = getStaticEventDescription(title);
    if (staticResult) return staticResult;

    // Try Investopedia search directly
    const investopediaResult = await tryInvestopediaSearch(title);
    if (investopediaResult) return investopediaResult;

    // Nothing found
    return {
        description: null,
        whyItMatters: null,
        usualEffect: null,
        frequency: null,
        source: null,
        sourceUrl: null,
        eventType,
    };
}

function trimToSentences(text: string, maxSentences: number): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    return sentences.slice(0, maxSentences).join(' ').trim();
}

// ── Investopedia search ───────────────────────────────────────

async function tryInvestopediaSearch(
    title: string
): Promise<FetchedDescription | null> {
    try {
        const query = title
            .replace(/\s+(m\/m|q\/q|y\/y)$/i, '')
            .trim();

        const searchUrl =
            `https://www.investopedia.com/search?q=` +
            encodeURIComponent(query);

        await randomSleep(300, 800);

        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html',
                'Referer': 'https://www.google.com/',
            },
        });

        if (!res.ok) return null;

        const html = await res.text();
        const $ = cheerio.load(html);

        const firstLink = $(
            '.search-results__item a, ' +
            '[class*="SearchResult"] a'
        )
            .first()
            .attr('href');

        if (!firstLink) return null;

        await randomSleep(500, 1500);

        const articleUrl = firstLink.startsWith('http')
            ? firstLink
            : `https://www.investopedia.com${firstLink}`;

        const articleRes = await fetch(articleUrl, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html',
                'Referer': searchUrl,
            },
        });

        if (!articleRes.ok) return null;

        const articleHtml = await articleRes.text();
        const $a = cheerio.load(articleHtml);

        const description = $a(
            '[class*="article-body"] p, ' +
            '.article__body p, ' +
            '[data-tracking-container="true"] p'
        )
            .first()
            .text()
            .trim();

        if (!description || description.length < 40) return null;

        return {
            description: trimToSentences(description, 3),
            whyItMatters: null,
            usualEffect: null,
            frequency: null,
            source: 'investopedia',
            sourceUrl: articleUrl,
            eventType: 'data_release',
        };

    } catch {
        return null;
    }
}