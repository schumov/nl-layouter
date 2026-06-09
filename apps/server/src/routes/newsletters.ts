// apps/server/src/routes/newsletters.ts
// Newsletter CRUD routes — 6 endpoints as a Fastify plugin module.
// Manual Zod safeParse used (not @fastify/type-provider-zod) for Zod v4 compatibility.
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { repository } from '../db/index.js';

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

  // GET /newsletters — lean list (no full document sent to client)
  fastify.get('/newsletters', async (_req, _reply) => {
    return repository.listNewsletters();
  });

  // POST /newsletters — create new newsletter with initial document
  fastify.post('/newsletters', async (request, reply) => {
    const parsed = CreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'title is required and must be non-empty' });
    }
    const created = await repository.createNewsletter({ title: parsed.data.title, document: INITIAL_DOC });
    return reply.code(201).send(created);
  });

  // GET /newsletters/:id — full document (used when opening builder)
  fastify.get('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = await repository.getNewsletter(id);
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
    const updated = await repository.updateNewsletterDocument(id, parsed.data.document as NewsletterDoc);
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
    const renamed = await repository.renameNewsletter(id, parsed.data.title);
    if (!renamed) return reply.code(404).send({ error: 'Newsletter not found' });
    return renamed;
  });

  // DELETE /newsletters/:id — hard delete
  fastify.delete('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await repository.deleteNewsletter(id);
    if (!deleted) return reply.code(404).send({ error: 'Newsletter not found' });
    return reply.code(204).send();
  });

};

export default newsletterRoutes;
