// src/modules/economic-calendar/ingestion/live/fetchForexFactoryHtml.ts
import { fetch } from 'undici';

export async function fetchForexFactoryHtml(url: string): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
    try {
        console.log(`[FF-HTML] Fetching: ${url}`);

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!res.ok) {
            return { ok: false, error: `HTTP ${res.status}` };
        }

        const html = await res.text();

        // Cloudflare challenge detection
        if (html.includes('cf-challenge') || html.includes('ray-id')) {
            return { ok: false, error: 'Cloudflare challenge detected' };
        }

        return { ok: true, html };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Unknown fetch error' };
    }
}
