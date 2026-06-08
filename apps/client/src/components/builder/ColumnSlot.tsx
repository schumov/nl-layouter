// apps/client/src/components/builder/ColumnSlot.tsx
//
// Phase 5: converted to dnd-kit droppable with selection + remove controls.
// Reads selection state directly from Zustand — no isSelected prop needed.
//
// CC-5: DRAG_TYPES.ELEMENT_CARD used in useDroppable data — never string literal
// Tailwind v4: ALL class names are complete string literals — no template literals

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
import { useNewsletterStore } from '../../store/useNewsletterStore';
import { DRAG_TYPES } from '../../dnd/types';
import { cn } from '../../lib/utils';
import { ElementRenderer } from './ElementRenderer';

interface ColumnSlotProps {
  slot:      ColumnSlotData;
  sectionId: string;  // kept for forward-compatibility with Phase 6+ actions; not used in Phase 5
}

export function ColumnSlot({ slot }: ColumnSlotProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Direct store reads — avoids prop drilling through ColumnGrid (Finding 8)
  const { removeElement, setSelectedElement } = useNewsletterStore();
  const isSelected = useNewsletterStore((s) => s.selectedElementId === slot.id);

  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: DRAG_TYPES.ELEMENT_CARD },  // CC-5: filter key for custom collision detection
  });

  // ── Empty slot ────────────────────────────────────────────────────────────
  if (!slot.element) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[80px] flex items-center justify-center',
          'border-2 rounded text-sm text-muted-foreground select-none',
          isOver
            ? 'border-green-400 bg-green-50 transition-colors duration-150'
            : 'border-dashed border-border',
          // D-01/D-02: only empty slot under cursor highlights green
          // D-03: "border-dashed" removed during isOver, "Drop element here" text unchanged
        )}
      >
        Drop element here
      </div>
    );
  }

  // ── Occupied slot ─────────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative group min-h-[80px] rounded overflow-hidden cursor-pointer',
        isSelected && 'ring-2 ring-ring ring-inset',
        // D-10: selection ring wraps the entire slot when this slot is selected
      )}
      onClick={(e) => {
        e.stopPropagation();
        // D-06: stopPropagation prevents click bubbling to BuilderCanvas clear handler
        setSelectedElement(slot.id);
        // Store slotId in selectedElementId — BuilderPage uses slot.id lookup (Finding 6)
      }}
    >
      <ElementRenderer element={slot.element} />

      {/* D-09/D-10/D-11: × remove button — absolute-positioned top-right interior overlay */}
      {isConfirming ? (
        // State 6: Remove confirm — 2-step inline confirm (D-11)
        <div
          aria-live="polite"
          className="absolute top-1 right-1 flex items-center gap-1"
        >
          <button
            className="text-xs font-semibold text-destructive hover:underline cursor-pointer whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              removeElement(slot.id);
              setSelectedElement(null);  // clear stale selection after element removed
            }}
          >
            Remove?
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirming(false);
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        // States 3/4/5: × button
        <button
          aria-label="Remove element"
          className={cn(
            'absolute top-1 right-1 flex items-center justify-center size-5 rounded',
            'text-muted-foreground hover:text-destructive hover:bg-accent',
            'transition-colors duration-100 transition-opacity duration-100',
            'opacity-0 group-hover:opacity-100',
            // D-10: hidden by default; visible on group-hover OR when selected
            isSelected && 'opacity-100',
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirming(true);
          }}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
