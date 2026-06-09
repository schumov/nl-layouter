// apps/server/src/db/repository.pg.ts
// Postgres implementation of NLRepository — uses Drizzle ORM + postgres.js.
import { eq, desc, sql } from 'drizzle-orm';
import { db } from './connection.js';
import { newsletters, presets } from './schema.js';
import type { NLRepository, NewsletterRow, NewsletterFull, PresetSummary, PresetFull, NewNewsletter } from './repository.js';

export function createPgRepository(): NLRepository {
  return {
    async listNewsletters(): Promise<NewsletterRow[]> {
      return db.select({
        id:           newsletters.id,
        title:        newsletters.title,
        updatedAt:    newsletters.updatedAt,
        sectionCount: sql<number>`COALESCE(jsonb_array_length(${newsletters.document}->'rows'), 0)`,
      }).from(newsletters).orderBy(desc(newsletters.updatedAt));
    },

    async getNewsletter(id: string): Promise<NewsletterFull | null> {
      const [row] = await db.select().from(newsletters).where(eq(newsletters.id, id));
      if (!row) return null;
      return {
        id: row.id,
        title: row.title,
        document: row.document as Record<string, unknown>,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },

    async createNewsletter(data: NewNewsletter): Promise<NewsletterFull> {
      const [created] = await db.insert(newsletters)
        .values({ title: data.title, document: data.document })
        .returning();
      return {
        id: created.id,
        title: created.title,
        document: created.document as Record<string, unknown>,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    },

    async updateNewsletterDocument(id: string, document: Record<string, unknown>): Promise<{ id: string; updatedAt: Date } | null> {
      const [updated] = await db.update(newsletters)
        .set({ document: document as Parameters<typeof newsletters.$inferInsert>['0']['document'] })
        .where(eq(newsletters.id, id))
        .returning({ id: newsletters.id, updatedAt: newsletters.updatedAt });
      return updated ?? null;
    },

    async renameNewsletter(id: string, title: string): Promise<{ id: string; title: string; updatedAt: Date } | null> {
      const [renamed] = await db.update(newsletters)
        .set({ title })
        .where(eq(newsletters.id, id))
        .returning({ id: newsletters.id, title: newsletters.title, updatedAt: newsletters.updatedAt });
      return renamed ?? null;
    },

    async deleteNewsletter(id: string): Promise<boolean> {
      const deleted = await db.delete(newsletters)
        .where(eq(newsletters.id, id))
        .returning({ id: newsletters.id });
      return deleted.length > 0;
    },

    async listPresets(type: 'header' | 'footer'): Promise<PresetSummary[]> {
      return db.select({
        id:        presets.id,
        type:      presets.type,
        name:      presets.name,
        thumbnail: presets.thumbnail,
      }).from(presets).where(eq(presets.type, type));
    },

    async getPreset(id: string): Promise<PresetFull | null> {
      const [row] = await db.select().from(presets).where(eq(presets.id, id));
      if (!row) return null;
      return {
        id: row.id,
        type: row.type,
        name: row.name,
        htmlContent: row.htmlContent,
        thumbnail: row.thumbnail ?? null,
      };
    },
  };
}
