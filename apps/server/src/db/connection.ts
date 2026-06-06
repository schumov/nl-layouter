import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// postgres.js queryClient — connection pool for all DB operations
// DATABASE_URL is validated by Zod in config.ts at server startup;
// this file imports process.env directly for use by drizzle-kit CLI as well.
const queryClient = postgres(process.env['DATABASE_URL']!);

export const db = drizzle({ client: queryClient });
