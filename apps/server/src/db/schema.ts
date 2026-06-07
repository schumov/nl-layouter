// apps/server/src/db/schema.ts
// Phase 2: newsletters table definition.
// NewsletterDoc defined as opaque JSONB type inline — avoids cross-package resolution
// issues with drizzle-kit's esbuild transpiler. Full type lives in apps/client.
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Opaque JSONB type annotation — cosmetic only, Drizzle stores/retrieves as unknown at runtime.
// Using Record<string, unknown> avoids the cross-package import path that breaks drizzle-kit push.
type NewsletterDoc = Record<string, unknown>;

export const newsletters = pgTable('newsletters', {
  id:        uuid('id').primaryKey().defaultRandom(),
  title:     text('title').notNull(),
  document:  jsonb('document').$type<NewsletterDoc>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
               .$onUpdate(() => new Date()),
});

// TypeScript helpers — import these in route handlers for type-safe query results
export type Newsletter    = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
