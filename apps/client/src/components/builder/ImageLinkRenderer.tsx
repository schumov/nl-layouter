import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ImageLinkElement, ImageElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.

interface ImageLinkRendererProps {
  element: ImageLinkElement;
}

export function ImageLinkRenderer({ element }: ImageLinkRendererProps) {
  // Build ImageElement-shaped props from the ImageLinkElement to pass to ImageRenderer
  // ImageLinkElement has all ImageElement fields (src, alt, width) plus href
  const imageProps: ImageElement = {
    type: 'image',
    id: element.id,
    src: element.src,
    alt: element.alt,
    width: element.width,
  };

  return (
    // D-11: wrap ImageRenderer in <a>; use relative for badge positioning
    // href fallback to '#' prevents navigation in builder when href is not yet set (Pitfall 4)
    <a
      href={element.href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block"
      onClick={(e) => e.stopPropagation()}
    >
      <ImageRenderer element={imageProps} />

      {/* D-11: ExternalLink badge — absolute top-right, builder-only chrome */}
      {/* data-builder-only="true" is required — Phase 9 export pipeline strips this element */}
      <span
        className="absolute top-1 right-1 flex items-center justify-center rounded-sm bg-background/80 p-0.5"
        data-builder-only="true"
        aria-hidden="true"
      >
        <ExternalLink className="size-[14px] text-muted-foreground" />
      </span>
    </a>
  );
}
