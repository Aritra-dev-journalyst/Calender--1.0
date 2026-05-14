import { db } from '@/db';
import { economicEvents } from '@/modules/economic-calendar/db/economicEvents.schema';
import { runGapFill } from '@/modules/economic-calendar/ingestion/jobs/runGapFill';
import { propagateDescriptions } from '@/modules/economic-calendar/services/propagateDescriptions';
import { sql } from 'drizzle-orm';

async function seedMissingMonths() {
    console.log('--- Seeding Missing Calendar Months ---');
    
    // 1. Find Gaps from April 2025 to May 2026
    // We target months that are either missing OR have suspiciously low data (< 100 events)
    const targetStart = new Date('2025-04-01');
    const targetEnd = new Date('2026-05-31');
    
    const result = await db.execute(sql`
        SELECT 
            TO_CHAR(starts_at_utc, 'YYYY-MM') as month,
            COUNT(*) as event_count
        FROM economic_events
        WHERE starts_at_utc >= ${targetStart} AND starts_at_utc <= ${targetEnd}
        GROUP BY month
    `);
    
    const stats = (result.rows as any[]).reduce((acc, r) => {
        acc[r.month] = Number(r.event_count);
        return acc;
    }, {} as Record<string, number>);
    
    console.log('Identifying gaps/low-data months in target range 2025-04 to 2026-05...');
    
    let curr = new Date(targetStart);
    const monthsToFill: Date[] = [];
    
    while (curr <= targetEnd) {
        const mStr = curr.toISOString().slice(0, 7);
        const count = stats[mStr] || 0;
        
        // If month is missing OR has < 100 events, mark it for fill
        if (count < 100) {
            monthsToFill.push(new Date(curr));
            if (count > 0) {
                console.log(`- ${mStr}: LOW DATA (${count} events) -> Flagged for re-fill`);
            } else {
                console.log(`- ${mStr}: MISSING -> Flagged for fill`);
            }
        }
        curr.setMonth(curr.getMonth() + 1);
    }
    
    if (monthsToFill.length === 0) {
        console.log('No gaps found in the target range!');
        process.exit(0);
    }
    
    console.log(`Found ${monthsToFill.length} missing months:`, monthsToFill.map(d => d.toISOString().slice(0, 7)));
    
    // 2. Fill them one by one
    for (const monthDate of monthsToFill) {
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0); // End of month
        
        console.log(`\n>>> Filling Gap: ${start.toISOString().slice(0, 7)}`);
        await runGapFill(start, end);
    }
    
    console.log('\n>>> Cleaning up data: Propagating descriptions...');
    await propagateDescriptions();
    
    console.log('\n--- Seeding Complete ---');
    process.exit(0);
}

seedMissingMonths().catch(err => {
    console.error(err);
    process.exit(1);
});
