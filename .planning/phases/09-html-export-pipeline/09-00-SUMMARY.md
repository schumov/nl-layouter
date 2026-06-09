# Plan 09-00 Summary — TDD RED Stubs + Server Vitest Setup

**Status**: COMPLETE  
**Commit**: 55707e8

## What was done
- Added vitest@3 + @vitest/coverage-v8 to `apps/server` devDeps; test/test:watch scripts
- Created `apps/server/vitest.config.ts` with JSX (react-jsx) esbuild support
- Updated `apps/server/tsconfig.json`: added `jsx: react-jsx` + `jsxImportSource: react`
- Created `apps/server/src/__tests__/fixtures/export.fixture.ts` (shared doc/element fixtures)
- 4 RED server test files: tiptapToHtml.test.ts (5), elementRenderers.test.ts (5), documentToEmailTree.test.ts (3), exportPipeline.test.ts (3)
- 1 RED client test file: BuilderHeader.export.test.tsx (2 tests)

## Outcome
Server: 4 files failing (module not found — correct RED). Client: 119 GREEN + 2 RED.
