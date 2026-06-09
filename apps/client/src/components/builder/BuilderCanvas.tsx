import React from 'react';
import type { NewsletterDoc } from '../../types/newsletter';
import { SortableRowList } from './SortableRowList';
import { HeaderPresetSlot } from './HeaderPresetSlot';
import { FooterPresetSlot } from './FooterPresetSlot';

interface BuilderCanvasProps {
  doc: NewsletterDoc | null;
  onCanvasClick?: () => void;   // D-06: click on canvas background clears selectedElementId
  headerPresetId: string;
  footerPresetId: string;
}

export function BuilderCanvas({ doc, onCanvasClick, headerPresetId, footerPresetId }: BuilderCanvasProps) {
  return (
    <div
      className="flex-[3] min-w-0 overflow-y-auto bg-canvas"
      onClick={onCanvasClick}
    >
      <div className="max-w-[640px] mx-auto py-8 space-y-2">
        <HeaderPresetSlot presetId={headerPresetId} />
        {doc ? (
          <div className="px-4 space-y-2">
            <SortableRowList rows={doc.rows} />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-16 px-4">
            No sections yet. Drag a layout from the palette to begin.
          </p>
        )}
        <FooterPresetSlot presetId={footerPresetId} />
      </div>
    </div>
  );
}
