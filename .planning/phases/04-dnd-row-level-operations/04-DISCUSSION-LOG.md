# Phase 4 Discussion Log

**Phase:** 4 — DnD: Row-Level Operations
**Date:** 2026-06-09
**Areas discussed:** Drag Ghost Overlay, Empty Canvas Drop Zone, Section Controls

---

## Area 1: Drag Ghost Overlay

**Q1: What should the dragged card look like mid-flight?**
Options presented: Semi-transparent clone | Column skeleton | Name card chip
**Selected:** Semi-transparent clone (80% opacity copy of palette card)

**Q2: Does the ghost also apply for canvas row reorders (CANVAS_ROW), or palette only?**
Options presented: Both | Palette only
**Selected:** Both — same semi-transparent clone overlay for canvas row reorder drags too

---

## Area 2: Empty Canvas Drop Zone

**Q1: What visual drop affordance when canvas has no sections?**
Options presented: Dashed drop box | Full canvas zone | Text only
**Selected:** Dashed drop box — tall dashed-border rectangle with "Drop a layout here" text

**Q2: How should the drop zone respond visually during drag-over?**
Options presented: Border + fill (bg-blue-50 border-blue-400) | Border only | You decide
**Selected:** Border + fill — `bg-blue-50 border-blue-400` solid border replaces dashed border

---

## Area 3: Section Controls

**Q1: Where should grip / delete / duplicate be positioned on each RowBlock?**
Options presented: Left strip | Top bar | Floating right
**Selected:** Floating right — control cluster outside the right edge of the RowBlock

**Q2: When are controls visible?**
Options presented: Always visible | Hover only
**Selected:** Always visible

**Q3: What happens when Delete is pressed?**
Options presented: Immediate deletion | Confirm prompt
**Selected:** Confirm prompt — inline "Delete?" + "Cancel" reveal on first click; second click dispatches removeSection

---

## Agent Discretion Items

- Section controls use `absolute right-0 top-1/2 -translate-y-1/2 translate-x-full` positioning (floating outside the block width) — decision by agent based on "floating right" UX intent and need to avoid slot interference for Phase 5
- Delete confirm state tracked in local `useState` per RowBlock (not Zustand) — ephemeral UI state, no persistence needed

## Deferred Ideas

- Insert-at-position for palette drops (not just bottom append) — future enhancement
- Undo/redo for section operations — v2 (UNDO-01 in requirements)
