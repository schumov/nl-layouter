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
import { assertNeverElement } from '../../types/newsletter';
import { ELEMENT_NAMES } from './BuilderPalette';
import { ImageEditor } from './ImageEditor';
import { ButtonEditor } from './ButtonEditor';
import { RichTextEditor } from './RichTextEditor';
import { DividerEditor } from './DividerEditor';

// ─── InspectorPanel ───────────────────────────────────────────────────────────

interface InspectorPanelProps {
  element:   ElementUnion;
  onBack:    () => void;    // → setSelectedElement(null) → palette restores
  onUpdate:  (patch: Partial<ElementUnion>) => void;
}

export function InspectorPanel({ element, onBack, onUpdate }: InspectorPanelProps) {
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
          {ELEMENT_NAMES[element.type]}
        </span>
      </div>

      {/* Body — routes to editor component by element type */}
      {(() => {
        switch (element.type) {
          case 'image':
          case 'image-link':
            return <ImageEditor element={element} onUpdate={onUpdate} />;
          case 'button':
            return <ButtonEditor element={element} onUpdate={onUpdate} />;
          case 'rich-text':
            // key={element.id} forces remount when a different rich-text element is selected,
            // ensuring TipTap reinitializes content from element.content (not stale doc state).
            return <RichTextEditor key={element.id} element={element} onUpdate={onUpdate} />;
          case 'divider':
            return <DividerEditor element={element} onUpdate={onUpdate} />;
          default:
            return assertNeverElement(element);
        }
      })()}
    </div>
  );
}
