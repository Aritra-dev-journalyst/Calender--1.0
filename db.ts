// db.ts — Drizzle PostgreSQL client
// Imported throughout the app via the @/db alias (tsconfig paths: "@/*" -> "./*")

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './src/modules/economic-calendar/db/economicEvents.schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
