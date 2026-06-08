import React from 'react';
import type { NewsletterDoc } from '../../types/newsletter';
import { SortableRowList } from './SortableRowList';

interface BuilderCanvasProps {
  doc: NewsletterDoc | null;
}

export function BuilderCanvas({ doc }: BuilderCanvasProps) {
  return (
    <div className="flex-[3] min-w-0 overflow-y-auto bg-canvas">
      <div className="max-w-[640px] mx-auto px-4 py-8 space-y-2">
        {doc ? (
          <SortableRowList rows={doc.rows} />
        ) : (
          // doc=null: newsletter not yet loaded (loading/error state)
          // SortableRowList handles the doc.rows.length === 0 empty drop zone state
          <p className="text-center text-sm text-muted-foreground py-16">
            No sections yet. Drag a layout from the palette to begin.
          </p>
        )}
      </div>
    </div>
  );
}
