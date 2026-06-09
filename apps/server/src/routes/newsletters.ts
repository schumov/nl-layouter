// apps/server/src/routes/newsletters.ts
// Newsletter CRUD routes — 6 endpoints as a Fastify plugin module.
// Manual Zod safeParse used (not @fastify/type-provider-zod) for Zod v4 compatibility.
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { newsletters } from '../db/schema.js';

// Local opaque type — avoid cross-package import. Full type in apps/client/src/types/newsletter.ts
type NewsletterDoc = Record<string, unknown>;

// ── Zod schemas for request body validation ────────────────────────────────
const CreateSchema    = z.object({ title: z.string().min(1) });
const UpdateDocSchema = z.object({ document: z.unknown() });
const RenameSchema    = z.object({ title: z.string().min(1) });

// ── Initial document shape (Decisions D-07 + D-08, updated Phase 8) ─────────
const INITIAL_DOC: NewsletterDoc = {
  header:       { presetId: 'header-minimal-logo', variables: {} },
  footer:       { presetId: 'footer-simple-links', variables: {} },
  rows:         [],
  globalStyles: {
    fontFamily:      'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    contentWidth:    600,
    primaryColor:    '#0066cc',
  },
};

// ── Plugin ─────────────────────────────────────────────────────────────────
const newsletterRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /newsletters — lean list (no full JSONB sent to client)
  fastify.get('/newsletters', async (_req, _reply) => {
    const rows = await db.select({
      id:           newsletters.id,
      title:        newsletters.title,
      updatedAt:    newsletters.updatedAt,
      sectionCount: sql<number>`COALESCE(jsonb_array_length(${newsletters.document}->'rows'), 0)`,
    }).from(newsletters)
      .orderBy(desc(newsletters.updatedAt));
    return rows;
  });

  // POST /newsletters — create new newsletter with initial document
  fastify.post('/newsletters', async (request, reply) => {
    const parsed = CreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'title is required and must be non-empty' });
    }
    const [created] = await db.insert(newsletters)
      .values({ title: parsed.data.title, document: INITIAL_DOC })
      .returning();
    return reply.code(201).send(created);
  });

  // GET /newsletters/:id — full document (used when opening builder)
  fastify.get('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db.select()
      .from(newsletters)
      .where(eq(newsletters.id, id));
    if (!row) return reply.code(404).send({ error: 'Newsletter not found' });
    return row;
  });

  // PUT /newsletters/:id — full document save (auto-save route)
  fastify.put('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateDocSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'document is required' });
    }
    const [updated] = await db.update(newsletters)
      .set({ document: parsed.data.document as NewsletterDoc })
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id, updatedAt: newsletters.updatedAt });
    if (!updated) return reply.code(404).send({ error: 'Newsletter not found' });
    return updated;
  });

  // PATCH /newsletters/:id — rename title only
  fastify.patch('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = RenameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'title is required and must be non-empty' });
    }
    const [renamed] = await db.update(newsletters)
      .set({ title: parsed.data.title })
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id, title: newsletters.title, updatedAt: newsletters.updatedAt });
    if (!renamed) return reply.code(404).send({ error: 'Newsletter not found' });
    return renamed;
  });

  // DELETE /newsletters/:id — hard delete
  fastify.delete('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(newsletters)
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id });
    if (!deleted.length) return reply.code(404).send({ error: 'Newsletter not found' });
    return reply.code(204).send();
  });

};

export default newsletterRoutes;
