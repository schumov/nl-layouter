import React from 'react';
import { Input } from '@/components/ui/input';
import type { ImageElement, ImageLinkElement } from '../../types/newsletter';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// ⚠️ font-medium (500) FORBIDDEN — only font-semibold (600) for labels.
// ⚠️ D-07: All fields dispatch onUpdate immediately on every onChange — no debounce.

// Accepts both image and image-link elements; href field is conditionally shown
type ImageEditorElement = ImageElement | ImageLinkElement;
type ImageEditorPatch = Partial<ImageElement> | Partial<ImageLinkElement>;

interface ImageEditorProps {
  element: ImageEditorElement;
  onUpdate: (patch: ImageEditorPatch) => void;
}

export function ImageEditor({ element, onUpdate }: ImageEditorProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Source URL field */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Source URL</label>
        <Input
          value={element.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="text-sm"
        />
      </div>

      {/* Alt Text field — ELEM-02 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Alt Text</label>
        <Input
          value={element.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Image description"
          className="text-sm"
        />
      </div>

      {/* Width field — D-03/D-04: free-form text, default "100%" */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Width</label>
        <Input
          value={element.width ?? '100%'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="e.g. 100% or 300px"
          className="text-sm"
        />
      </div>

      {/* Link URL field — shown ONLY for image-link type (ELEM-03) */}
      {element.type === 'image-link' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Link URL</label>
          <Input
            value={(element as ImageLinkElement).href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="https://..."
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
