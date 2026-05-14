// src/scripts/backfillDescriptions.ts
export {};

import { backfillMissingDescriptions } from '@/modules/economic-calendar/services/backfillDescriptions';

async function main() {
    await backfillMissingDescriptions();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});