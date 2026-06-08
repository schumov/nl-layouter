import React from 'react';
import { Image } from 'lucide-react';
import type { ImageElement } from '../../types/newsletter';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// NEVER build class names via template literals.

interface ImageRendererProps {
  element: ImageElement;
}

export function ImageRenderer({ element }: ImageRendererProps) {
  // D-10: show branded placeholder when src is empty (falsy covers '' and undefined)
  if (!element.src) {
    return (
      <div className="min-h-[70px] flex flex-col items-center justify-center bg-accent rounded gap-1 p-4">
        <Image className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Add image URL</span>
      </div>
    );
  }

  // D-10: render <img> when src is non-empty
  // CC-6: width in inline style (not Tailwind class) for email export compatibility
  // className="block" prevents inline baseline gap (email client rendering pitfall)
  return (
    <img
      src={element.src}
      alt={element.alt}
      role="img"
      className="block min-h-[70px] w-full"
      style={{
        width: element.width ?? '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}
