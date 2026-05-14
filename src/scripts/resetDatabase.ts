import { db } from '@/db';
import { economicEvents } from '@/modules/economic-calendar/db/economicEvents.schema';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('⚠️ [Reset] Wiping all economic events from the database...');
    
    try {
        // Truncate the table (resets everything)
        await db.execute(sql`TRUNCATE TABLE ${economicEvents} RESTART IDENTITY CASCADE`);
        console.log('✅ [Reset] Database wiped successfully.');
    } catch (err) {
        console.error('❌ [Reset] Failed to wipe database:', err);
    }
    
    process.exit(0);
}

main();
