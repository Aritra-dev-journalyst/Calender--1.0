// src/modules/economic-calendar/ingestion/live/fetchFFJsonFeed.ts
// FIXED — add shape logging so you know exactly what comes back

export type FFJsonEvent = {
    title: string;
    country: string;
    date: string;
    time?: string;
    impact: string;
    forecast: string;
    previous: string;
    actual?: string;
};

const FF_FEEDS = {
    thisWeek:
        'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
    nextWeek:
        'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
};

async function fetchFeed(
    url: string,
    label: string
): Promise<FFJsonEvent[]> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
        },
    });

    if (!res.ok) {
        throw new Error(`${label} feed error: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
        throw new Error(`${label} feed returned non-array`);
    }

    // Log first event shape so you can debug format issues
    if (data.length > 0) {
        console.log(
            `[${label}] First event shape:`,
            JSON.stringify(data[0], null, 2)
        );
        console.log(`[${label}] Total events: ${data.length}`);
    }

    return data;
}

export async function fetchFFAllFeeds(): Promise<{
    thisWeek: FFJsonEvent[];
    nextWeek: FFJsonEvent[];
}> {
    const [thisWeek, nextWeek] = await Promise.allSettled([
        fetchFeed(FF_FEEDS.thisWeek, 'ThisWeek'),
        fetchFeed(FF_FEEDS.nextWeek, 'NextWeek'),
    ]);

    return {
        thisWeek:
            thisWeek.status === 'fulfilled' ? thisWeek.value : [],
        nextWeek:
            nextWeek.status === 'fulfilled' ? nextWeek.value : [],
    };
}