// apps/client/src/components/builder/RichTextStaticRenderer.tsx
//
// Canvas renderer for rich-text elements that are NOT currently selected.
// Uses generateHTML() — a pure schema-based converter — not a live ProseMirror instance.
//
// D-04: use generateHTML + dangerouslySetInnerHTML (NOT @tiptap/static-renderer here;
//       static-renderer is reserved for the Phase 9 HTML export pipeline).
// D-05: textStyle is an element-level CSS wrapper, NOT a TipTap mark.
//       The preset <div> wraps the HTML produced by generateHTML().
// D-02: MUST use RICH_TEXT_EXTENSIONS from lib/tiptap-extensions.ts — the SAME array
//       used by the live editor. Using a different extension list silently drops
//       inline-style attributes (Color, TextAlign) from the rendered HTML.
// CC-2/CC-6: preset styles are React.CSSProperties inline objects — no Tailwind color
//             or font-size classes.
// ⚠️  TAILWIND V4 RULE: All class names must be complete string literals.

import React from 'react';
import { generateHTML } from '@tiptap/core';
import type { RichTextElement } from '../../types/newsletter';
import { RICH_TEXT_EXTENSIONS } from '@/lib/tiptap-extensions';

// ── Named preset typography map (D-05) ────────────────────────────────────────
// Values are matched by RichTextStaticRenderer tests — do not change without
// updating the tests in 07-00-PLAN.md.
const PRESET_STYLES: Record<RichTextElement['textStyle'], React.CSSProperties> = {
  header:    { fontSize: '28px', fontWeight: '700', lineHeight: '1.2' },
  subheader: { fontSize: '20px', fontWeight: '600', lineHeight: '1.3' },
  body:      { fontSize: '16px', fontWeight: '400', lineHeight: '1.6' },
  code:      { fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.5' },
};

interface RichTextStaticRendererProps {
  element: RichTextElement;
}

export function RichTextStaticRenderer({ element }: RichTextStaticRendererProps) {
  // generateHTML uses the extension renderHTML() functions to produce a safe HTML string.
  // XSS note: content is produced by TipTap's own JSON serialiser (never raw user HTML).
  const html = generateHTML(element.content, RICH_TEXT_EXTENSIONS);

  return (
    <div
      style={PRESET_STYLES[element.textStyle]}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
