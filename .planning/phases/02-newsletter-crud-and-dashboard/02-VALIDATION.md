---
phase: 2
slug: newsletter-crud-and-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (in `apps/client` devDeps from Phase 1) |
| **Config file** | `apps/client/vitest.config.ts` — Wave 0 creates if missing |
| **Quick run command** | `pnpm --filter ./apps/client test --run` |
| **Full suite command** | `pnpm --recursive run test` |
| **TypeScript check (client)** | `pnpm --filter ./apps/client exec tsc --noEmit` |
| **TypeScript check (server)** | `pnpm --filter ./apps/server exec tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter ./apps/client test --run`
- **After every plan wave:** Run `pnpm --recursive run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | NL-01 | — | N/A | integration (API) | `pnpm --filter ./apps/server test --run` | ❌ Wave 0 | ⬜ pending |
| 02-02-01 | 02 | 1 | NL-01, NL-02, NL-03, NL-04, NL-05 | — | N/A | unit (hook) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-04-01 | 04 | 2 | NL-02 | — | N/A | unit (component) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-05-01 | 05 | 2 | NL-01 | — | N/A | unit (component) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-06-01 | 06 | 2 | NL-04 | — | N/A | unit (hook) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-07-01 | 07 | 2 | NL-05 | — | N/A | unit (hook) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-08-01 | 08 | 3 | NL-06 | — | N/A | unit (hook) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 | ⬜ pending |
| 02-ALL | ALL | — | ALL | — | N/A | type check | `pnpm --filter ./apps/client exec tsc --noEmit` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/client/vitest.config.ts` — Vitest config with jsdom environment (create if absent)
- [ ] `apps/client/src/hooks/__tests__/useAutoSave.test.ts` — stubs for NL-06 (no save on load, saves after 1500ms, debounces, retries on error)
- [ ] `apps/client/src/hooks/__tests__/useNewsletters.test.ts` — stubs for NL-01/NL-02 (create, list)
- [ ] `apps/client/src/hooks/__tests__/useDeleteNewsletter.test.ts` — stub for NL-05 (optimistic removal + undo)
- [ ] `apps/client/src/components/dashboard/__tests__/CreateNewsletterDialog.test.ts` — stub for NL-01 (Create button disabled until name non-empty)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Navigate to `/newsletters/:id` after create | NL-01 | Requires browser navigation | POST → assert URL changes to /newsletters/[uuid] |
| Newsletter card shows correct sectionCount | NL-02 | Requires DB fixture | Create newsletter with 2 rows; reload dashboard; confirm card shows "2 sections" |
| Hard-reload after edit preserves document | NL-03 | Requires actual DB round-trip | Make edit, wait for "Saved ✓", hard reload, confirm content present |
| API smoke: all 6 routes respond | ALL | Requires running server | `curl http://localhost:3001/newsletters` → 200 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
