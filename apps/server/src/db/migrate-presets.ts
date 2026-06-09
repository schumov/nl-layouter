// apps/server/src/db/migrate-presets.ts
// One-time migration script: creates the 'presets' table if it does not exist.
// Run with: pnpm --filter nl-layouter-server migrate:presets
import { config } from '../config.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const queryClient = postgres(config.DATABASE_URL);
const db = drizzle({ client: queryClient });

async function run() {
  console.log('Creating presets table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS presets (
      id            TEXT PRIMARY KEY,
      type          TEXT NOT NULL,
      name          TEXT NOT NULL,
      html_content  TEXT NOT NULL,
      preview_thumbnail TEXT
    )
  `);
  console.log('presets table created (or already exists).');
  await queryClient.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
