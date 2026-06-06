// dotenv/config reads process.cwd()/.env at startup.
// When `tsx watch src/index.ts` runs from apps/server/, it reads apps/server/.env.
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — set it in apps/server/.env'),
  PORT: z.coerce.number().default(3001),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Throws with descriptive Zod error at startup if any required env var is missing or invalid.
// Do NOT wrap in try/catch here — fail fast is the intended behavior.
export const config = EnvSchema.parse(process.env);

export type Config = z.infer<typeof EnvSchema>;
