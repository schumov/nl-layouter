import React from 'react';
import type { NewsletterDoc } from '../../types/newsletter';
import { RowBlock } from './RowBlock';

interface BuilderCanvasProps {
  doc: NewsletterDoc | null;
}

export function BuilderCanvas({ doc }: BuilderCanvasProps) {
  return (
    <div className="flex-[3] min-w-0 overflow-y-auto bg-canvas">
      <div className="max-w-[640px] mx-auto px-4 py-8 space-y-2">
        {doc?.rows.map((section) => (
          <RowBlock key={section.id} section={section} />
        ))}
        {(!doc || doc.rows.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-16">
            No sections yet. Drag a layout from the palette to begin.
          </p>
        )}
      </div>
    </div>
  );
}
