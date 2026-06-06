---
phase: 01-foundation-and-stack-setup
plan: "01"
subsystem: monorepo-scaffold
tags: [pnpm, typescript, react, fastify, workspace]

dependency_graph:
  requires: []
  provides:
    - pnpm-workspace with apps/client + apps/server
    - tsconfig.base.json strict TypeScript config
    - all client and server npm dependencies installed
  affects:
    - all subsequent plans in Phase 1 and all later phases

tech_stack:
  added:
    - pnpm@10.34.1 (workspace package manager)
    - TypeScript 6.0.3 (shared strict config)
    - React 19.2.7 + react-dom 19.2.7
    - Vite 8.0.16 + @vitejs/plugin-react 6.0.2
    - Fastify 5.8.5 + @fastify/cors 11.2.0 + @fastify/cookie 11.0.2
    - drizzle-orm 0.45.2 + drizzle-kit 0.31.10
    - TipTap 3.26.0 (@tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extensions)
    - @dnd-kit/core 6.3.1 + sortable 10.0.0 + utilities 3.2.2 + modifiers 9.0.0
    - Tailwind CSS 4.3.0 + @tailwindcss/vite 4.3.0
    - Zustand 5.0.14 + Immer 11.1.8
    - @tanstack/react-query 5.101.0
    - zod 4.4.3 + postgres 3.4.9 + tsx 4.22.4
    - concurrently 10.0.3
  patterns:
    - pnpm workspace monorepo (apps/* glob)
    - tsconfig references pattern (tsconfig.json → tsconfig.app.json + tsconfig.node.json)
    - tsconfig.base.json extending pattern (both apps extend from root)

key_files:
  created:
    - pnpm-workspace.yaml
    - package.json (root workspace)
    - tsconfig.base.json
    - .gitignore
    - apps/client/package.json
    - apps/client/tsconfig.json
    - apps/client/tsconfig.app.json
    - apps/client/tsconfig.node.json
    - apps/client/vite.config.ts
    - apps/client/index.html
    - apps/client/src/main.tsx
    - apps/server/package.json
    - apps/server/tsconfig.json
    - pnpm-lock.yaml
  modified: []

decisions:
  - "pnpm approve-builds --all run to allow esbuild postinstall scripts (needed for Vite native binaries on Windows)"
  - "exactOptionalPropertyTypes and noUncheckedIndexedAccess enabled in tsconfig.base.json (can be disabled per-app if needed)"
  - "@tailwindcss/vite intentionally NOT added to vite.config.ts plugins (Plan 01-06 adds it when configuring Tailwind v4)"

metrics:
  duration: "~5 minutes"
  completed: "2026-06-06"
  tasks_completed: 3
  tasks_total: 3
  files_created: 14
  files_modified: 0
---

# Phase 1 Plan 01: Monorepo Scaffold Summary

**One-liner:** pnpm 10.34.1 workspace with React 19 + Fastify 5 apps scaffolded, all 30+ dependencies pinned, strict TypeScript base config in place.

---

## What Was Built

A complete pnpm monorepo workspace skeleton for NL Layouter:

- **Root workspace** (`pnpm-workspace.yaml` + `package.json`): defines `apps/*` as workspace packages, provides `pnpm dev` script via `concurrently`
- **Shared TypeScript config** (`tsconfig.base.json`): `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- **Client app** (`apps/client/`): Vite 8 + React 19 scaffold with all 22 dependencies, tsconfig references pattern, `@/*` path alias
- **Server app** (`apps/server/`): Fastify 5 + Drizzle ORM scaffold with all 9 dependencies, tsconfig extending base
- **pnpm-lock.yaml**: 239 packages installed across 3 workspace projects

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install pnpm + create root workspace files | 2771755 | pnpm-workspace.yaml, package.json, tsconfig.base.json, .gitignore |
| 2 | Scaffold apps/client with all dependencies | 0ffbb75 | apps/client/package.json, tsconfig.*.json, vite.config.ts, index.html, src/main.tsx |
| 3 | Scaffold apps/server + run pnpm install | 2515590 | apps/server/package.json, apps/server/tsconfig.json, pnpm-lock.yaml |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pnpm install via corepack failed with key signature error**
- **Found during:** Task 1
- **Issue:** `pnpm --version` threw `Cannot find matching keyid` error from corepack's signature verification. The corepack shim at `C:\Users\schumov\AppData\Roaming\nvm\v22.9.0\pnpm.cmd` was broken.
- **Fix:** Ran `npm install -g pnpm --force` to install pnpm 10.34.1 directly via npm, overwriting the broken corepack shim.
- **Files modified:** None (system-level change)
- **Commit:** 2771755

**2. [Rule 2 - Missing Critical Functionality] esbuild build scripts blocked by pnpm security policy**
- **Found during:** Task 3 (pnpm install)
- **Issue:** pnpm 10.x blocks postinstall scripts by default. esbuild requires postinstall to download platform-specific native binaries — without this, Vite would fail to start.
- **Fix:** Ran `pnpm approve-builds --all` which updated `pnpm-workspace.yaml` with `allowBuilds: esbuild: true` and ran the esbuild postinstall scripts.
- **Files modified:** `pnpm-workspace.yaml` (allowBuilds section added)
- **Commit:** 2515590 (included in server scaffold commit)

---

## Verification Results

All plan success criteria confirmed:

| Criterion | Status |
|-----------|--------|
| `pnpm --version` returns 10.34.1 | ✅ |
| `pnpm ls -r` lists nl-layouter-client + nl-layouter-server | ✅ |
| `apps/client/package.json` has all 22 deps at exact versions | ✅ |
| `apps/server/package.json` has all 9 deps at exact versions | ✅ |
| `tsconfig.base.json` has strict: true, noUnusedLocals, noUnusedParameters | ✅ |
| Both app tsconfigs extend `../../tsconfig.base.json` | ✅ |
| `apps/client/node_modules` and `apps/server/node_modules` exist | ✅ |

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `<div>NL Layouter — loading...</div>` | apps/client/src/main.tsx | Intentional placeholder — Plan 01-06 wires QueryClientProvider + RouterProvider |

---

## Threat Flags

None — `.gitignore` correctly excludes `.env` and `apps/server/.env` (T-01-01 mitigated).

## Self-Check: PASSED

All 15 created files confirmed present on disk. All 3 task commits (2771755, 0ffbb75, 2515590) confirmed in git log.
