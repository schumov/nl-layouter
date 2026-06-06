---
phase: 01-foundation-and-stack-setup
plan: "02"
subsystem: server-foundation
tags: [fastify, zod, cors, env-validation, health-check]

dependency_graph:
  requires:
    - 01-01 (monorepo scaffold; apps/server deps installed)
  provides:
    - apps/server/src/config.ts (Zod-validated env config export)
    - apps/server/src/index.ts (Fastify v5 server; GET /health; CORS)
  affects:
    - all subsequent plans that add server routes (Phase 2+)
    - Plan 01-03 (Drizzle DB connection — imports config for DATABASE_URL)

tech_stack:
  added: []
  patterns:
    - Zod v4 env validation at startup (fail-fast; z.coerce.number() for PORT)
    - Fastify v5 server entry with await plugin registration (Promise-based)
    - CORS locked to explicit origin (not '*') with credentials: true
    - Health endpoint with locked response schema (no information disclosure)

key_files:
  created:
    - apps/server/src/config.ts
    - apps/server/src/index.ts
  modified:
    - apps/server/tsconfig.json (added types: [node])

decisions:
  - "Response schema on GET /health locked to {status: string} only — no env, uptime, or version (T-02-01)"
  - "CORS origin = config.CLIENT_URL (explicit http://localhost:3000), not '*' (T-02-02)"
  - "EnvSchema.parse() not wrapped in try/catch — intentional fail-fast startup behavior (T-02-04)"
  - "tsconfig.json types=[node] added to expose process global (was missing from Plan 01-01 scaffold)"

metrics:
  duration: "~2 minutes"
  completed: "2026-06-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 1 Plan 02: Fastify Server Foundation Summary

**One-liner:** Fastify v5 server on port 3001 with Zod env validation (fail-fast on missing DATABASE_URL), CORS locked to localhost:3000, and GET /health endpoint with schema-locked response.

---

## What Was Built

Two files constitute the complete Fastify server foundation:

- **`apps/server/src/config.ts`**: `EnvSchema` validates `process.env` at startup via Zod v4. Missing or invalid `DATABASE_URL` throws a descriptive Zod error immediately — no silent fallback. `PORT` uses `z.coerce.number()` (env vars are strings; coerce handles the conversion). `NODE_ENV` uses `z.enum()`. Exports both `config` and `Config` type.

- **`apps/server/src/index.ts`**: Fastify v5 server with Pino structured logging. Registers `@fastify/cors` (origin from `config.CLIENT_URL`, credentials: true) and `@fastify/cookie` (pre-registered for Better Auth in v2). `GET /health` returns `{"status":"ok"}` with a JSON Schema response lock preventing accidental information disclosure. Listens on `0.0.0.0:3001`.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Zod env schema and validated config export | 2b8e647 | apps/server/src/config.ts, apps/server/tsconfig.json |
| 2 | Fastify server entry with CORS, cookie plugin, and health route | eb1b59a | apps/server/src/index.ts |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] apps/server/tsconfig.json missing `types: ["node"]`**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** `tsc` reported `Cannot find name 'process'` — the server tsconfig had no `types` field, so Node.js globals were not available. The `@types/node` devDependency was installed (Plan 01-01) but not wired into the tsconfig compiler options.
- **Fix:** Added `"types": ["node"]` to `apps/server/tsconfig.json` compilerOptions.
- **Files modified:** `apps/server/tsconfig.json`
- **Commit:** 2b8e647 (included with Task 1)

---

## Verification Results

All plan success criteria confirmed:

| Criterion | Status |
|-----------|--------|
| `apps/server/src/config.ts` compiles without errors (`tsc --noEmit` exit 0) | ✅ |
| `apps/server/src/index.ts` compiles without errors (`tsc --noEmit` exit 0) | ✅ |
| `config.ts` contains `import 'dotenv/config'` | ✅ |
| `config.ts` contains `DATABASE_URL: z.string().min(1` | ✅ |
| `config.ts` contains `PORT: z.coerce.number().default(3001)` | ✅ |
| `config.ts` contains `z.enum(['development', 'production', 'test'])` | ✅ |
| `config.ts` contains `export const config = EnvSchema.parse(process.env)` | ✅ |
| `config.ts` contains `export type Config` | ✅ |
| `index.ts` contains `import Fastify from 'fastify'` | ✅ |
| `index.ts` contains `import cors from '@fastify/cors'` | ✅ |
| `index.ts` contains `import cookie from '@fastify/cookie'` | ✅ |
| `index.ts` imports from `'./config.js'` (ESM explicit extension) | ✅ |
| `index.ts` uses `origin: config.CLIENT_URL` (not `origin: '*'`) | ✅ |
| `index.ts` has `server.get('/health'` | ✅ |
| `index.ts` has `return { status: 'ok' }` | ✅ |
| `index.ts` has `host: '0.0.0.0'` | ✅ |

> **Note:** Full runtime verification (starting server, hitting /health) requires `DATABASE_URL` in `apps/server/.env` — this is established in Plan 01-03 (Drizzle DB connection). TypeScript compilation is the full automated verification available at this stage.

---

## Known Stubs

None — both files are functionally complete for their scope.

---

## Threat Flags

All threats from plan's threat model addressed:

| Threat | Status |
|--------|--------|
| T-02-01: Information disclosure via /health | ✅ Mitigated — response schema locks output to `{status: string}` only |
| T-02-02: CORS spoofing via wildcard origin | ✅ Mitigated — `origin: config.CLIENT_URL` explicit; `credentials: true` |
| T-02-03: Silent env misconfiguration | ✅ Mitigated — `EnvSchema.parse(process.env)` throws on missing/invalid vars |
| T-02-04: DoS via fail-fast crash | ✅ Accepted — intentional behavior; better than silent misconfiguration |

## Self-Check: PASSED
