import React from 'react';
import type { ElementUnion } from '../../types/newsletter';
import { assertNeverElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';
import { ImageLinkRenderer } from './ImageLinkRenderer';
import { ButtonRenderer } from './ButtonRenderer';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.

interface ElementRendererProps {
  element: ElementUnion;
}

// Routes each element type to its dedicated canvas renderer.
// Phase 7 will replace the rich-text and divider stub cases with real renderers.
export function ElementRenderer({ element }: ElementRendererProps) {
  switch (element.type) {
    case 'image':
      return <ImageRenderer element={element} />;

    case 'image-link':
      return <ImageLinkRenderer element={element} />;

    case 'button':
      return <ButtonRenderer element={element} />;

    case 'rich-text':
      // Phase 7 stub — RichTextRenderer not yet implemented
      return (
        <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
          [rich-text]
        </div>
      );

    case 'divider':
      // Phase 7 stub — DividerRenderer not yet implemented
      return (
        <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
          [divider]
        </div>
      );

    default:
      // TypeScript exhaustiveness: if all 5 cases above are handled, this line
      // can never be reached at runtime. Adding a new type to ElementUnion
      // without handling it here will cause a compile-time error.
      return assertNeverElement(element);
  }
}
