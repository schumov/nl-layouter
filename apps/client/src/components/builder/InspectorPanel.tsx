// apps/client/src/components/builder/InspectorPanel.tsx
//
// Phase 5 placeholder inspector panel.
// Shown when an element slot is selected (selectedElementId non-null in Zustand).
// Phase 6 replaces the placeholder body with real element editors.
//
// D-04: swaps into right panel; back arrow restores BuilderPalette
// D-05: shows element type name + "Editing available in the next step." note

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElementUnion } from '../../types/newsletter';

// ─── ELEMENT_LABELS ───────────────────────────────────────────────────────────
// Display names for element types in the inspector header.
// Must match DraggableElementCard labels (Plan 05-02) — locked UI-SPEC copy.

const ELEMENT_LABELS: Record<ElementUnion['type'], string> = {
  'image':      'Image',
  'image-link': 'Image with Link',
  'button':     'Button',
  'rich-text':  'Rich Text',
  'divider':    'Divider',
};

// ─── InspectorPanel ───────────────────────────────────────────────────────────

interface InspectorPanelProps {
  elementType: ElementUnion['type'];
  onBack:      () => void;   // → setSelectedElement(null) → palette restores
}

export function InspectorPanel({ elementType, onBack }: InspectorPanelProps) {
  return (
    <div className="flex-[2] min-w-0 border-l bg-background overflow-y-auto flex flex-col">
      {/* Header — back arrow + element type name */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to palette"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">
          {ELEMENT_LABELS[elementType]}
        </span>
      </div>

      {/* Body — placeholder note (Phase 6 replaces with real editors) */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Editing available in the next step.
        </p>
      </div>
    </div>
  );
}
