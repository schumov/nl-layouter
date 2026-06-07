import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import newsletterRoutes from './routes/newsletters.js';

const server = Fastify({
  logger: true,
});

// CORS: allow requests from Vite dev server on port 3000
await server.register(cors, {
  origin: config.CLIENT_URL,
  credentials: true,
});

// Cookie plugin: needed by Better Auth (added in v2)
await server.register(cookie);

// Newsletter CRUD routes
await server.register(newsletterRoutes);

// Health check — returns exactly {"status":"ok"}
// DO NOT add env info, version numbers, or uptime — information disclosure risk
server.get(
  '/health',
  {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
          required: ['status'],
        },
      },
    },
  },
  async () => {
    return { status: 'ok' };
  }
);

// Start server
try {
  await server.listen({ port: config.PORT, host: '0.0.0.0' });
  server.log.info(`Server running on http://0.0.0.0:${config.PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
