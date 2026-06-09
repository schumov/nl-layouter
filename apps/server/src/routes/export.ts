// apps/server/src/routes/export.ts
// Phase 9: Export API route — POST /newsletters/:id/export
//
// Pipeline: load doc from DB → load preset HTML → renderToEmailHtml() → stream as download
//
// EXPORT-01: triggered by POST from client export button
// EXPORT-07: Content-Disposition: attachment triggers browser download

import type { FastifyPluginAsync } from 'fastify';
import { repository } from '../db/index.js';
import { renderToEmailHtml } from '../export/pipeline.js';
import type { NewsletterDoc } from '../export/documentToEmailTree.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Load a preset's HTML from the database by slug ID.
 * Returns empty string gracefully if the preset is not found or DB is unavailable.
 */
async function getPresetHtml(presetId: string): Promise<string> {
  if (!presetId) return '';
  try {
    const preset = await repository.getPreset(presetId);
    return preset?.htmlContent ?? '';
  } catch {
    // Graceful fallback — export works without presets (e.g., DB cold-start)
    return '';
  }
}

/**
 * Sanitise a newsletter title to a safe filename (lowercase, hyphens).
 */
function toFilename(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'newsletter';
}

// ── Route plugin ───────────────────────────────────────────────────────────────

const exportRoute: FastifyPluginAsync = async (fastify) => {

  fastify.post('/newsletters/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Load newsletter from DB
    const newsletter = await repository.getNewsletter(id);

    if (!newsletter) {
      return reply.code(404).send({ error: 'Newsletter not found' });
    }

    const doc = newsletter.document as unknown as NewsletterDoc;

    // Load header + footer preset HTML (graceful empty string on failure)
    const headerPresetId = (doc.header?.presetId ?? '') as string;
    const footerPresetId = (doc.footer?.presetId ?? '') as string;
    const [headerHtml, footerHtml] = await Promise.all([
      getPresetHtml(headerPresetId),
      getPresetHtml(footerPresetId),
    ]);

    // Run full export pipeline
    const html = await renderToEmailHtml(doc, headerHtml, footerHtml);

    const filename = `${toFilename(newsletter.title)}.html`;

    return reply
      .header('Content-Type', 'text/html; charset=UTF-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(html);
  });

};

export default exportRoute;
