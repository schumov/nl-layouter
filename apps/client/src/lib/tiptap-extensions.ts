// apps/client/src/lib/tiptap-extensions.ts
//
// CRITICAL: Both useEditor (RichTextEditor) and generateHTML (RichTextStaticRenderer)
// MUST import RICH_TEXT_EXTENSIONS from this file. Using different extension lists
// causes silent attribute-loss bugs — TipTap's JSON schema must match between
// the editor that writes JSON and the renderer that reads it. (D-02)
//
// Extensions installed and configured here:
//   StarterKit      — Bold, Italic, Underline, Link, BulletList, OrderedList,
//                     Heading, Paragraph, HardBreak, History (all in one bundle)
//   TextStyleKit    — TextStyle + Color + FontSize + FontFamily + LineHeight
//                     (all emit inline styles in TipTap v3 — no CSS classes; CC-2 satisfied)
//   TextAlign       — left/center/right alignment emits style="text-align:X" (v3 default)
//                     Must declare which node types support alignment.
//
// Out of scope for Phase 7 UI (but available via JSON):
//   TextAlign UI buttons — deferred to Phase 8+ (CONTEXT.md Deferred Ideas)
//   Text color picker    — extension present but no UI in Phase 7
//   Font size picker     — extension present but no UI in Phase 7

import { StarterKit } from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { TextAlign } from '@tiptap/extension-text-align';

export const RICH_TEXT_EXTENSIONS = [
  StarterKit,
  TextStyleKit,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
];
