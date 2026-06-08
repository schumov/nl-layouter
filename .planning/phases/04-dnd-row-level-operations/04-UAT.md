---
status: complete
phase: 04-dnd-row-level-operations
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md
started: 2026-06-08T13:55:00Z
updated: 2026-06-08T14:04:00Z
completed: 2026-06-08T14:04:00Z
---

## Current Test

number: 1
name: Empty Canvas Drop Zone
expected: |
  Open the builder for any newsletter. The canvas (left panel) shows a dashed-border
  "Drop a layout here" zone. Drag a layout card from the palette over the empty zone —
  the border turns solid blue and the background turns light blue (bg-blue-50 border-blue-400).
  Releasing outside the zone does nothing.
awaiting: user response

## Tests

### 1. Empty Canvas Drop Zone
expected: Open the builder for any newsletter. The canvas (left panel) shows a dashed-border "Drop a layout here" zone. Drag a layout card from the palette over the empty zone — the border turns solid blue and the background turns light blue (bg-blue-50 border-blue-400). Releasing outside the zone does nothing.
result: pass

### 2. Drag Layout Card → Creates Section
expected: Drag any layout card (e.g. "1 Column") from the palette and drop it on the canvas. A new section of that layout type appears immediately on the canvas with the correct column structure (e.g. 1 column for "1 Column", 2 columns for "2 Columns").
result: pass

### 3. Section Order Persists After Save/Reload
expected: Drag "1 Column" then "3 Columns" to the canvas. They appear in that order (1 Column on top, 3 Columns below). Save by waiting 1.5s for auto-save ("Saved ✓" appears). Reload the page — the two sections are still present in the same order.
result: pass

### 4. SectionControls Always Visible
expected: After adding at least one section, each section shows three controls floating to its right: a grip handle (vertical lines icon), a copy icon, and a trash icon. These controls are always visible — no hovering required.
result: fail → fixed (confirmed pass after fix)
issue: `overflow-hidden` on RowBlock outer div was clipping the `translate-x-full`-positioned controls. Fixed by moving `overflow-hidden` to a wrapper around `ColumnGrid` only.
commit: 16f79ff

### 5. Drag Grip to Reorder
expected: With two or more sections on the canvas, drag the grip handle (leftmost control) of a section up or down. The section moves to the new position and the other sections shift accordingly. The canvas reflows immediately.
result: pass

### 6. Duplicate Section
expected: Click the copy icon on any section. An identical copy of that section appears directly below the original, with the same layout type and column structure.
result: pass

### 7. Delete Section — Confirm Flow
expected: Click the trash icon on a section. An inline "Delete?" button and a "Cancel" link appear (the trash icon disappears). Clicking "Cancel" dismisses the confirm and restores the trash icon. Clicking "Delete?" removes the section from the canvas.
result: pass

## Summary

total: 7
passed: 7
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- **overflow-hidden clipping SectionControls (fixed):** `RowBlock` had `overflow-hidden` on its outer div, clipping the controls that use `translate-x-full` to float outside the card. Fixed by scoping `overflow-hidden` to a wrapper around `ColumnGrid` only. Committed as `16f79ff`.
