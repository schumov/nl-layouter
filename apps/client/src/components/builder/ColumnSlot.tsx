import React from 'react';
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
import { ElementRenderer } from './ElementRenderer';

interface ColumnSlotProps {
  slot:      ColumnSlotData;
  sectionId: string; // unused in Phase 3 — retained for Phase 4 DnD wiring
}

export function ColumnSlot({ slot }: ColumnSlotProps) {
  if (slot.element) {
    return <ElementRenderer element={slot.element} />;
  }
  return (
    <div className="min-h-[80px] flex items-center justify-center border-2 border-dashed border-border rounded text-sm text-muted-foreground select-none">
      Drop element here
    </div>
  );
}
