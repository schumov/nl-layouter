// apps/client/src/dnd/types.ts
//
// DRAG_TYPES — the single source of truth for all drag interaction types in NL Layouter.
//
// ARCHITECTURE RULE (CC-5): These types are defined here and used everywhere.
// Never use string literals in useDraggable/useDroppable/useSortable — always reference DRAG_TYPES.
// This prevents type collision between the two co-existing DnD patterns:
//   1. Palette → Canvas (add new items)
//   2. Canvas → Canvas (reorder existing items)

export const DRAG_TYPES = {
  /** Palette layout card dragged onto the canvas → creates a new section */
  LAYOUT_CARD: 'LAYOUT_CARD',
  /** Palette element card dragged into a column slot → places a new element */
  ELEMENT_CARD: 'ELEMENT_CARD',
  /** Canvas section drag handle → reorders existing sections within the canvas */
  CANVAS_ROW: 'CANVAS_ROW',
  /** Canvas element moved between column slots → relocates an existing element */
  CANVAS_ELEMENT: 'CANVAS_ELEMENT',
} as const;

export type DragType = (typeof DRAG_TYPES)[keyof typeof DRAG_TYPES];

/**
 * ACCEPT_CONSTRAINTS — which drag types each droppable zone accepts.
 *
 * Copy these arrays directly into useDroppable({ accept: ... }) calls.
 * Do not use ad-hoc arrays — always reference this map to prevent drift.
 *
 * Canvas section list (SortableRowList):
 *   Accepts: LAYOUT_CARD (from palette, creates section) + CANVAS_ROW (reorder)
 *
 * Column slot (ColumnSlot):
 *   Accepts: ELEMENT_CARD (from palette, places element) + CANVAS_ELEMENT (move between slots)
 */
export const ACCEPT_CONSTRAINTS = {
  CANVAS_SECTION_LIST: [DRAG_TYPES.LAYOUT_CARD, DRAG_TYPES.CANVAS_ROW],
  COLUMN_SLOT: [DRAG_TYPES.ELEMENT_CARD, DRAG_TYPES.CANVAS_ELEMENT],
} as const;

export type AcceptConstraintKey = keyof typeof ACCEPT_CONSTRAINTS;
