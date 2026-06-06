---
phase: 01-foundation-and-stack-setup
plan: "03"
subsystem: database-layer
tags: [drizzle-orm, postgres-js, neon-tech, drizzle-kit, docker-compose]

dependency_graph:
  requires:
    - 01-01 (monorepo scaffold — drizzle-orm@0.45.2 + postgres@3.4.9 already installed)
  provides:
    - Drizzle + postgres.js singleton exported from apps/server/src/db/connection.ts
    - drizzle-kit CLI config pointing at Neon.tech PostgreSQL
    - Empty Phase 1 schema (tables added in Phase 2)
    - docker-compose.yml for future local PostgreSQL use
  affects:
    - All Phase 2+ route handlers that import `db` from the connection singleton

tech_stack:
  added:
    - drizzle-orm/postgres-js connection singleton pattern
    - drizzle-kit 0.31.10 CLI config (drizzle.config.ts)
    - Neon.tech PostgreSQL (cloud, free tier) as development database
    - postgres.js 3.4.9 (already installed; first use in connection.ts)
  patterns:
    - Connection singleton: `const queryClient = postgres(url); export const db = drizzle({ client: queryClient })`
    - dotenv/config loaded at top of drizzle.config.ts so CLI picks up DATABASE_URL from apps/server/.env
    - drizzle.config.ts excluded from tsconfig rootDir scope (drizzle-kit runs its own TS transpilation)

key_files:
  created:
    - apps/server/src/db/connection.ts
    - apps/server/src/db/schema.ts
    - apps/server/drizzle.config.ts
    - apps/server/.env.example
    - docker-compose.yml
  modified:
    - apps/server/tsconfig.json (removed drizzle.config.ts from include array)

decisions:
  - "drizzle.config.ts excluded from tsconfig.json include array — rootDir=./src conflict; drizzle-kit runs its own TS transpilation via esbuild"
  - "postgres.js bracket-notation process.env['DATABASE_URL'] used — avoids noUncheckedIndexedAccess false positive"
  - ".env.example committed with placeholder only (T-03-01 mitigated)"

metrics:
  duration: "~10 minutes"
  completed: "2026-06-06"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 1
---

# Phase 1 Plan 03: Drizzle ORM Database Layer Summary

**One-liner:** Drizzle ORM + postgres.js connection singleton wired to Neon.tech PostgreSQL; `drizzle-kit push` exits 0 against live cloud DB confirming valid connection string.

---

## What Was Built

The complete database connection layer for NL Layouter:

- **`apps/server/src/db/connection.ts`**: postgres.js query client + Drizzle singleton (`export const db`) — the single import all Phase 2+ route handlers will use
- **`apps/server/src/db/schema.ts`**: Empty Phase 1 placeholder — signals to drizzle-kit that the schema exists but has no tables yet; Phase 2 adds the `newsletters` table with JSONB document column
- **`apps/server/drizzle.config.ts`**: drizzle-kit CLI config with `dialect: 'postgresql'`, `schema: './src/db/schema.ts'`, `out: './drizzle'`, and `import 'dotenv/config'` to auto-load `apps/server/.env`
- **`apps/server/.env.example`**: Committed placeholder template — real credentials stay in gitignored `.env`
- **`docker-compose.yml`**: postgres:16-alpine service definition for future local use (Docker not yet installed in this environment)
- **`apps/server/.env`**: Gitignored file with real Neon.tech `DATABASE_URL` — never committed

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create DB files and docker-compose.yml | 3debba7 | docker-compose.yml, drizzle.config.ts, schema.ts, connection.ts, .env.example, tsconfig.json |
| 2 | Write apps/server/.env (DATABASE_URL) | (not committed — gitignored) | apps/server/.env |
| 3 | drizzle-kit push → verify Neon.tech DB | (no files changed) | Output: `[✓] No changes detected` |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tsconfig.json `rootDir` conflict with drizzle.config.ts inclusion**
- **Found during:** Task 1 — tsc --noEmit verification
- **Issue:** `apps/server/tsconfig.json` had `"include": ["src", "drizzle.config.ts"]` but `"rootDir": "./src"`. TypeScript error TS6059: `drizzle.config.ts` is not under `rootDir`. The tsconfig was scaffolded in Plan 01-01 with this conflict already present.
- **Fix:** Removed `"drizzle.config.ts"` from the `include` array. drizzle-kit runs its own TypeScript transpilation (esbuild internally) and does not rely on tsc to process `drizzle.config.ts`. The file works correctly with drizzle-kit CLI; only tsc type-checking of the config is lost (acceptable trade-off).
- **Files modified:** `apps/server/tsconfig.json`
- **Commit:** 3debba7

**2. [Rule 2 - Missing Critical Functionality] .env.example not in plan but required by T-03-01**
- **Found during:** Task 1 — threat model review
- **Issue:** The plan's `<threat_model>` (T-03-01) mandates `.env.example` with placeholder only to prevent credential leak, but the task action didn't include creating it explicitly.
- **Fix:** Created `apps/server/.env.example` with placeholder DATABASE_URL and all other required env vars.
- **Files modified:** `apps/server/.env.example` (new file)
- **Commit:** 3debba7

---

## drizzle-kit push Output

```
No config path provided, using default 'drizzle.config.ts'
Reading config file 'C:\DEV\AI-Projects\NL_Layouter\apps\server\drizzle.config.ts'
Using 'postgres' driver for database querying
[✓] Pulling schema from database...
[i] No changes detected
```

Exit code: **0** ✅ — Neon.tech connection valid; empty schema matches DB state.

---

## Verification Results

| Criterion | Status |
|-----------|--------|
| `apps/server/src/db/connection.ts` exports `db` using `drizzle-orm/postgres-js` | ✅ |
| `apps/server/drizzle.config.ts` has `dialect: 'postgresql'` and `schema: './src/db/schema.ts'` | ✅ |
| `apps/server/drizzle.config.ts` has `import 'dotenv/config'` | ✅ |
| `docker-compose.yml` exists at project root with postgres:16-alpine | ✅ |
| `docker-compose.yml` has port mapping `5432:5432` | ✅ |
| `apps/server/src/db/schema.ts` contains `Phase 1 placeholder` | ✅ |
| `apps/server/.env` exists with real DATABASE_URL | ✅ |
| `git status` does NOT show `apps/server/.env` as tracked | ✅ |
| `pnpm drizzle-kit push` (from apps/server) exits 0 | ✅ |
| `tsc --noEmit` in apps/server exits 0 | ✅ |

---

## Known Stubs

None — this plan is infrastructure only. The `db` singleton is wired but not called anywhere until Phase 2 adds the `newsletters` table and CRUD routes.

---

## Threat Flags

None — all T-03-xx threats mitigated as planned:

| Threat | Status |
|--------|--------|
| T-03-01 Information Disclosure (DATABASE_URL in git) | ✅ Mitigated — `.gitignore` excludes `apps/server/.env`; `.env.example` has placeholder only |
| T-03-02 Tampering (drizzle-kit push) | ✅ Accepted — empty schema; no destructive changes possible |
| T-03-03 Elevation of Privilege (SSL) | ✅ Mitigated — `sslmode=require` in DATABASE_URL |
| T-03-04 DoS (connection pool exhaustion) | ✅ Accepted — no API routes use DB in Phase 1 |

---

## Self-Check: PASSED

All 5 created files confirmed present. Task commit 3debba7 confirmed in git log. `apps/server/.env` verified gitignored (not in git status). `drizzle-kit push` exit code 0 confirmed.
