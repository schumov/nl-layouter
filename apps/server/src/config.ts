// dotenv/config reads process.cwd()/.env at startup.
// When `tsx watch src/index.ts` runs from apps/server/, it reads apps/server/.env.
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  // DB_TYPE selects the database backend.
  // 'postgres' (default) uses DATABASE_URL with postgres.js + Drizzle.
  // 'mssql' uses MSSQL_CONNECTION_STRING with the mssql package.
  DB_TYPE: z.enum(['postgres', 'mssql']).default('postgres'),
  DATABASE_URL: z.string().optional(),
  MSSQL_CONNECTION_STRING: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).superRefine((val, ctx) => {
  if (val.DB_TYPE === 'postgres' && !val.DATABASE_URL) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['DATABASE_URL'], message: 'DATABASE_URL is required when DB_TYPE=postgres' });
  }
  if (val.DB_TYPE === 'mssql' && !val.MSSQL_CONNECTION_STRING) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MSSQL_CONNECTION_STRING'], message: 'MSSQL_CONNECTION_STRING is required when DB_TYPE=mssql' });
  }
});

// Throws with descriptive Zod error at startup if any required env var is missing or invalid.
// Do NOT wrap in try/catch here — fail fast is the intended behavior.
export const config = EnvSchema.parse(process.env);

export type Config = z.infer<typeof EnvSchema>;
