// apps/server/src/routes/presets.ts
// Read-only preset endpoints — serves developer-seeded HTML preset data to the client.
// No write/delete endpoints — presets are managed via seed.ts, not user actions.
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { presets } from '../db/schema.js';

// Zod v4 — validate query param 'type' as 'header' | 'footer'
const TypeQuerySchema = z.object({
  type: z.enum(['header', 'footer']),
});

const presetsRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /presets?type=header|footer
  // Returns list of preset summaries — id, type, name, thumbnail only.
  // html_content is intentionally excluded from list response (too heavy for selector UI).
  fastify.get('/presets', async (request, reply) => {
    const parsed = TypeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'type query param must be "header" or "footer"' });
    }
    const rows = await db
      .select({
        id:        presets.id,
        type:      presets.type,
        name:      presets.name,
        thumbnail: presets.thumbnail,
      })
      .from(presets)
      .where(eq(presets.type, parsed.data.type));
    return rows;
  });

  // GET /presets/:id
  // Returns full preset row including htmlContent for rendering in the canvas.
  fastify.get('/presets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db
      .select()
      .from(presets)
      .where(eq(presets.id, id));
    if (!row) return reply.code(404).send({ error: 'Preset not found' });
    return row;
  });

};

export default presetsRoutes;
