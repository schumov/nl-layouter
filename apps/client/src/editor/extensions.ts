// apps/client/src/editor/extensions.ts
//
// TipTap v3 extension configuration — LOCKED IN PHASE 1.
//
// ARCHITECTURE RULE (CC-2): All renderHTML overrides MUST emit style="" only.
// NEVER emit class="" — Gmail strips <style> blocks, Outlook ignores class attributes.
//
// Phase 1: renderHTML stubs have empty style strings as placeholders.
// Phase 7: Full inline-style mappings are filled in (bold → font-weight:bold, etc.)
//
// Import this array in useEditor({ extensions: emailSafeExtensions })
// It is the single source of truth for all TipTap extension configuration.

import StarterKit from '@tiptap/starter-kit';
import { Placeholder, UndoRedo } from '@tiptap/extensions';  // v3 consolidated package
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// NOTE: StarterKit bundles Bold, Italic, Strike, Code, Heading, BulletList,
// OrderedList, Blockquote, HorizontalRule, etc.
// In Phase 7, individual marks (Bold, Italic, etc.) are extracted from StarterKit
// and extended with full inline-style renderHTML. For Phase 1, we configure
// StarterKit to disable built-in undo/redo (we use UndoRedo from @tiptap/extensions).

export const emailSafeExtensions = [
  StarterKit.configure({
    // Disable StarterKit's built-in undo/redo — use UndoRedo from @tiptap/extensions instead
    // ('undoRedo' is the v3 key — renamed from 'history' in TipTap v2)
    undoRedo: false,
  }),

  // UndoRedo — v3 renamed from History. Import from @tiptap/extensions (NOT @tiptap/extension-history).
  UndoRedo,

  // TextStyle — required foundation for the Color extension
  TextStyle,

  // Color — inline text color. Phase 7 configures renderHTML to emit style="color: #xxx"
  Color,

  // Placeholder — empty editor hint text
  Placeholder.configure({
    placeholder: 'Start typing…',
  }),
];

// ─── Phase 7 TODO ────────────────────────────────────────────────────────────
// When implementing RichTextEditor in Phase 7, extend the following marks
// from StarterKit to use inline-style renderHTML:
//
//   Bold.extend({ renderHTML: ({ HTMLAttributes }) => ['span', { style: 'font-weight: bold;', ...HTMLAttributes }, 0] })
//   Italic.extend({ renderHTML: ({ HTMLAttributes }) => ['span', { style: 'font-style: italic;', ...HTMLAttributes }, 0] })
//   Color.extend({ renderHTML: ({ HTMLAttributes }) => ['span', { style: `color: ${HTMLAttributes.color ?? ''}`, ...HTMLAttributes }, 0] })
//
// TextAlign extension (included in StarterKit v3) must render:
//   ['p', { style: `text-align: ${attrs.textAlign}` }, 0]
// ─────────────────────────────────────────────────────────────────────────────
