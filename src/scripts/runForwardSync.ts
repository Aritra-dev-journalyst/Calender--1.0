// src/scripts/runForwardSync.ts

import { runForwardSync } from '@/modules/economic-calendar/ingestion/jobs/runForwardSync';

runForwardSync()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });