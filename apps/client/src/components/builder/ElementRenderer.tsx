import React from 'react';
import type { ElementUnion } from '../../types/newsletter';
import { assertNeverElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';
import { ImageLinkRenderer } from './ImageLinkRenderer';
import { ButtonRenderer } from './ButtonRenderer';
import { RichTextStaticRenderer } from './RichTextStaticRenderer';
import { DividerRenderer } from './DividerRenderer';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// Phase 7: replaces rich-text + divider stubs with real canvas renderers.
// Architecture: RichTextEditor is NEVER mounted in ElementRenderer — only in InspectorPanel.
//   Canvas always uses RichTextStaticRenderer for rich-text (no ProseMirror on canvas).
//   This enforces the STATE.md "one active editor instance" constraint.

interface ElementRendererProps {
  element: ElementUnion;
}

// Routes each element type to its dedicated canvas renderer.
// Rich-text: always static renderer (no live editor on canvas — editing via InspectorPanel only).
// Divider: always DividerRenderer.
export function ElementRenderer({ element }: ElementRendererProps) {
  switch (element.type) {
    case 'image':
      return <ImageRenderer element={element} />;

    case 'image-link':
      return <ImageLinkRenderer element={element} />;

    case 'button':
      return <ButtonRenderer element={element} />;

    case 'rich-text':
      // Static renderer — no live ProseMirror on canvas.
      // Live editor is mounted in InspectorPanel when this element is selected.
      return <RichTextStaticRenderer element={element} />;

    case 'divider':
      return <DividerRenderer element={element} />;

    default:
      // TypeScript exhaustiveness: if all 5 cases above are handled, this line
      // can never be reached at runtime. Adding a new type to ElementUnion
      // without handling it here will cause a compile-time error.
      return assertNeverElement(element);
  }
}
