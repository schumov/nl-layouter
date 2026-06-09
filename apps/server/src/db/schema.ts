// apps/server/src/db/schema.ts
// Phase 2: newsletters table definition.
// Phase 8: presets table — text-slug PK (not UUID) for stable cross-references in INITIAL_DOC.
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

// ── Phase 8: Presets ─────────────────────────────────────────────────────────
// Text-slug primary key (not UUID) — enables stable cross-references in INITIAL_DOC.
// Example slug: 'header-minimal-logo', 'footer-simple-links'
// No createdAt/updatedAt — presets are developer-seeded read-only data (not user-editable).
export const presets = pgTable('presets', {
  id:          text('id').primaryKey(),          // e.g. 'header-minimal-logo'
  type:        text('type').notNull(),            // 'header' | 'footer'
  name:        text('name').notNull(),            // display name shown in PresetSelector dialog
  htmlContent: text('html_content').notNull(),    // raw HTML — trusted developer seed data only
  thumbnail:   text('preview_thumbnail'),         // nullable — Phase 9+ concern; seeded as null
});

export type Preset    = typeof presets.$inferSelect;
export type NewPreset = typeof presets.$inferInsert;
