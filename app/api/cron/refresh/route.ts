// app/api/cron/refresh/route.ts
// Called automatically by Vercel Cron on a schedule.
// Manually callable with: curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/refresh

import { NextResponse } from 'next/server';
import { runForwardSync } from '@/modules/economic-calendar/ingestion/jobs/runForwardSync';
import { propagateDescriptions } from '@/modules/economic-calendar/services/propagateDescriptions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — Vercel Pro allows up to 300s

export async function GET(request: Request) {
    // Validate the cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startedAt = new Date();
    console.log('[Cron/Refresh] Starting scheduled calendar refresh...');

    try {
        // Step 1: Sync this week + next week events from ForexFactory
        await runForwardSync({ triggerReason: 'vercel_cron' });

        // Step 2: Propagate existing descriptions to new matching events
        await propagateDescriptions();

        const duration = Date.now() - startedAt.getTime();
        console.log(`[Cron/Refresh] Done in ${duration}ms`);

        return NextResponse.json({
            success: true,
            duration_ms: duration,
            timestamp: startedAt.toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Cron/Refresh] Failed:', message);

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
