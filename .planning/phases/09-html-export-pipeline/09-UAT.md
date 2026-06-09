---
status: partial
phase: 09-html-export-pipeline
source: 09-00-SUMMARY.md, 09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-04-SUMMARY.md, 09-05-SUMMARY.md, 09-06-SUMMARY.md, 09-07-SUMMARY.md
started: 2026-06-15T00:00:00Z
updated: 2026-06-09T11:18:00Z
---

## Current Test

[testing paused — 8 items blocked by Neon DB ECONNRESET (pre-existing dev environment issue)]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/client. Start both from scratch (pnpm dev or equivalent). Server boots without errors, no crash on startup, health endpoint responds. A basic API call (GET /health or GET /newsletters) returns a live response.
result: pass

### 2. Export Button Visible
expected: Open a newsletter in the builder. The header toolbar shows an "Export" button alongside the existing Save/Preview controls.
result: blocked
blocked_by: third-party
reason: "Neon DB ECONNRESET — GET /newsletters returns 500, newsletter list cannot load. Pre-existing dev environment issue, not a Phase 9 regression."

### 3. Export Button Loading State
expected: With the newsletter open and the server running, click "Export". The button label changes to "Exporting…" and the button becomes disabled (not clickable) while the request is in flight.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 4. HTML File Download
expected: After clicking "Export", the browser downloads a `.html` file named after the newsletter title (e.g. `my-newsletter.html`). A success toast appears once the download completes.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 5. Downloaded File Opens in Browser
expected: Open the downloaded `.html` file in a browser. The full newsletter renders visually — header section at top, content sections in the middle, footer at the bottom — with correct formatting and no broken layout.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 6. Table-Based Layout (No Flex/Grid)
expected: Inspect the downloaded HTML source. Multi-column rows use only `<table>` and `<td>` elements for layout — no `display:flex` or `display:grid` present anywhere in the file.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 7. CSS Inlined (No Style Blocks)
expected: Inspect the downloaded HTML source. All styles appear as `style=""` attributes on elements. There are no `<style>` blocks remaining in the file (juice has inlined everything).
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 8. MSO Conditional Comments for Multi-Column
expected: In the downloaded HTML source, any multi-column rows (2col, 3col, etc.) are wrapped in `<!--[if mso | IE]>` conditional comments for Outlook VML table compatibility.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

### 9. Pre-Header Text in HTML
expected: If you set pre-header text in the builder (the preview text field), open the downloaded HTML and confirm a hidden `<span style="display:none;...">` near the top of `<body>` contains that pre-header text.
result: blocked
blocked_by: third-party
reason: "Cannot open newsletter due to Neon DB ECONNRESET."

## Summary

total: 9
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 8

## Gaps

[none — all blocks are pre-existing Neon DB connectivity issue, not Phase 9 code defects]
