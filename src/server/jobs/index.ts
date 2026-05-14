// Wire into your app startup
// src/server/index.ts OR src/app/layout.tsx server side

import { startCalendarJobs } from '@/server/jobs/startJobs';

// Call once when server starts
startCalendarJobs().catch(console.error);