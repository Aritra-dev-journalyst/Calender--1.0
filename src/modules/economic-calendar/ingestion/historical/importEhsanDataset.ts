import fs from 'fs';
import { parse } from 'csv-parse';
import { db } from '@/db';
import { economicEvents } from '@/modules/economic-calendar/db/economicEvents.schema';

export async function importEhsanDataset(csvPath: string) {
    console.log('------------------------------------------');
    console.log(`[Historical] 🚀 INGESTION STARTING...`);
    console.log(`[Historical] File: ${csvPath}`);
    console.log('------------------------------------------');

    const BATCH_SIZE = 1000;
    let buffer: any[] = [];
    let processedCount = 0;

    const parser = fs.createReadStream(csvPath).pipe(
        parse({
            columns: true,
            skip_empty_lines: true,
        })
    );

    return new Promise((resolve, reject) => {
        parser.on('data', async (record) => {
            try {
                // Pause the stream while we write to DB to prevent memory overflow
                parser.pause();

                const date = new Date(record.DateTime);
                if (isNaN(date.getTime())) {
                    parser.resume();
                    return;
                }

                const details = parseDetailColumn(record.Detail || '');
                const sourceKey = `${date.getTime()}_${record.Currency}_${record.Event}`.replace(/\s+/g, '_');

                buffer.push({
                    source: 'historical_import',
                    sourceKey: sourceKey,
                    title: record.Event,
                    currency: record.Currency?.toUpperCase(),
                    impact: mapImpact(record.Impact),
                    startsAtUtc: date,
                    actual: record.Actual || null,
                    forecast: record.Forecast || null,
                    previous: record.Previous || null,
                    description: details.description,
                    whyItMatters: details.whyTradersCare,
                    usualEffect: details.usualEffect,
                    frequency: details.frequency,
                    status: 'published',
                });

                if (buffer.length >= BATCH_SIZE) {
                    await db.insert(economicEvents).values(buffer).onConflictDoNothing();
                    processedCount += buffer.length;
                    console.log(`[Historical] ⚡ Processed ${processedCount} records...`);
                    buffer = [];
                }

                parser.resume();
            } catch (err) {
                console.error('[Row Error]', err);
                parser.resume();
            }
        });

        parser.on('error', (err) => {
            console.error('[Stream Error]', err);
            reject(err);
        });

        parser.on('end', async () => {
            if (buffer.length > 0) {
                await db.insert(economicEvents).values(buffer).onConflictDoNothing();
                processedCount += buffer.length;
            }
            console.log('------------------------------------------');
            console.log(`[Historical] 🎉 FINISHED! Total: ${processedCount}`);
            console.log('------------------------------------------');
            resolve(true);
        });
    });
}

function parseDetailColumn(detail: string) {
    const parts = detail.split('|').map(p => p.trim());
    
    const findPart = (key: string) => {
        const found = parts.find(p => p.startsWith(key));
        return found ? found.split(':')[1]?.trim() : null;
    };

    return {
        description: findPart('Description') || findPart('Source') || null,
        whyTradersCare: findPart('Why Traders Care') || findPart('Measures') || null,
        usualEffect: findPart('Usual Effect') || null,
        frequency: findPart('Frequency') || null,
    };
}

function mapImpact(val: string): 'low' | 'medium' | 'high' | 'none' {
    const v = val?.toLowerCase();
    if (v.includes('high')) return 'high';
    if (v.includes('medium')) return 'medium';
    if (v.includes('low')) return 'low';
    return 'none';
}
