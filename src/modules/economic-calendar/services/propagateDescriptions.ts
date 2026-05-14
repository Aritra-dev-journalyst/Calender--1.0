// src/modules/economic-calendar/services/propagateDescriptions.ts
import { db } from '@/db';
import { economicEvents } from '../db';
import { isNotNull, isNull, and, eq, sql } from 'drizzle-orm';

/**
 * Finds events that have descriptions and copies them to events with the same 
 * title and currency that are currently missing descriptions.
 * This is extremely efficient and fills "gaps" in descriptive data 
 * without hitting external APIs.
 */
export async function propagateDescriptions(): Promise<{ updated: number }> {
    console.log('[Propagate] Identifying events missing descriptions...');

    // We use a raw SQL query for performance as this cross-join update 
    // is complex in Drizzle's current ORM state for this specific pattern
    const result = await db.execute(sql`
        WITH desc_source AS (
            SELECT DISTINCT ON (title, currency)
                title,
                currency,
                description,
                why_it_matters,
                usual_effect,
                frequency,
                description_source
            FROM economic_events
            WHERE description IS NOT NULL
            ORDER BY title, currency, updated_at DESC
        )
        UPDATE economic_events e
        SET 
            description = s.description,
            why_it_matters = s.why_it_matters,
            usual_effect = s.usual_effect,
            frequency = s.frequency,
            description_source = 'inherited',
            updated_at = NOW()
        FROM desc_source s
        WHERE e.title = s.title 
          AND e.currency = s.currency 
          AND e.description IS NULL;
    `);

    const updatedCount = result.rowCount || 0;
    console.log(`[Propagate] Successfully inherited descriptions for ${updatedCount} events.`);
    
    return { updated: updatedCount };
}
