import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// postgres.js queryClient — connection pool for all DB operations
// DATABASE_URL is validated by Zod in config.ts at server startup;
// this file imports process.env directly for use by drizzle-kit CLI as well.
//
// idle_timeout: close connections idle for 20 s (before Neon's ~300 s cutoff)
// max_lifetime: recycle connections after 30 min regardless of activity
// connect_timeout: fail fast (10 s) rather than hanging indefinitely
const queryClient = postgres(process.env['DATABASE_URL']!, {
  idle_timeout: 20,
  max_lifetime: 1800,
  connect_timeout: 10,
});

export const db = drizzle({ client: queryClient });
