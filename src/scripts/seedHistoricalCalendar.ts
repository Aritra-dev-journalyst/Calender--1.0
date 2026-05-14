// src/scripts/seedHistoricalCalendar.ts

import { importEhsanDataset } from '@/modules/economic-calendar/ingestion/historical/importEhsanDataset';

async function main() {
    const csvPath = process.argv[2];

    if (!csvPath) {
        console.error(
            'Usage: npx tsx src/scripts/seedHistoricalCalendar.ts <path-to-csv>'
        );
        process.exit(1);
    }

    await importEhsanDataset(csvPath);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});