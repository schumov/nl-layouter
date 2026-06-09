// apps/client/src/components/builder/RichTextEditor.tsx
//
// Live TipTap editor — rendered in the InspectorPanel when a rich-text element is selected.
//
// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// D-02: MUST use RICH_TEXT_EXTENSIONS from lib/tiptap-extensions.ts — same array as generateHTML.
// D-06: NO useEffect cleanup for editor.destroy() — v3 EditorInstanceManager handles this.
// D-06: BubbleMenu from '@tiptap/react/menus' (subpath) — NOT from '@tiptap/react' (v3 breaking change).
// D-06: BubbleMenu uses options={{ ... }} (Floating UI) — NOT tippyOptions (v2 Tippy API).
// font-medium is FORBIDDEN — use font-semibold for labels (STATE.md).

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { RichTextElement } from '../../types/newsletter';
import { RICH_TEXT_EXTENSIONS } from '@/lib/tiptap-extensions';

// ── Named preset metadata ─────────────────────────────────────────────────────
// Labels match CONTEXT.md Specifics. The value is the textStyle discriminant.
const PRESETS: Array<{ label: string; value: RichTextElement['textStyle'] }> = [
  { label: 'Header',    value: 'header'    },
  { label: 'Subheader', value: 'subheader' },
  { label: 'Body Text', value: 'body'      },
  { label: 'Code',      value: 'code'      },
];

interface RichTextEditorProps {
  element: RichTextElement;
  onUpdate: (patch: Partial<RichTextElement>) => void;
}

export function RichTextEditor({ element, onUpdate }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: element.content,
    onUpdate: ({ editor: e }) => {
      onUpdate({ content: e.getJSON() });
    },
    // No immediatelyRender option needed — this is a client-only component (no SSR).
    // No useEffect cleanup — v3 EditorInstanceManager destroys the editor on unmount. (D-06)
  });

  return (
    <div className="flex flex-col gap-3 p-4">

      {/* ── Named preset picker (D-05) ─────────────────────────────────── */}
      {/* Dispatches onUpdate({ textStyle }) — does NOT write a TipTap mark */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Text Style
        </span>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(({ label, value }) => {
            const isActive = element.textStyle === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onUpdate({ textStyle: value })}
                className={
                  isActive
                    ? 'px-2 py-1 text-xs rounded font-semibold ring-2 ring-primary bg-primary text-primary-foreground'
                    : 'px-2 py-1 text-xs rounded font-semibold bg-muted text-muted-foreground hover:bg-accent'
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Editor content area ───────────────────────────────────────── */}
      <div className="rounded border border-border focus-within:ring-2 focus-within:ring-ring min-h-[120px] p-2">
        {editor && (
          <>
            {/* BubbleMenu: shown when text is selected. Import from subpath (v3 breaking change). */}
            <BubbleMenu
              editor={editor}
              options={{ placement: 'top', offset: 8 }}
              shouldShow={({ editor: e }) => !e.view.state.selection.empty}
            >
              <div className="flex items-center gap-1 rounded border border-border bg-background shadow-md p-1">
                <button
                  type="button"
                  aria-label="Bold"
                  aria-pressed={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={
                    editor.isActive('bold')
                      ? 'px-2 py-1 text-xs font-semibold rounded bg-primary text-primary-foreground'
                      : 'px-2 py-1 text-xs font-semibold rounded hover:bg-accent'
                  }
                >
                  B
                </button>
                <button
                  type="button"
                  aria-label="Italic"
                  aria-pressed={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={
                    editor.isActive('italic')
                      ? 'px-2 py-1 text-xs italic font-semibold rounded bg-primary text-primary-foreground'
                      : 'px-2 py-1 text-xs italic font-semibold rounded hover:bg-accent'
                  }
                >
                  I
                </button>
                <button
                  type="button"
                  aria-label="Underline"
                  aria-pressed={editor.isActive('underline')}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={
                    editor.isActive('underline')
                      ? 'px-2 py-1 text-xs underline font-semibold rounded bg-primary text-primary-foreground'
                      : 'px-2 py-1 text-xs underline font-semibold rounded hover:bg-accent'
                  }
                >
                  U
                </button>
                <button
                  type="button"
                  aria-label="Link"
                  aria-pressed={editor.isActive('link')}
                  onClick={() => {
                    const previousUrl = editor.getAttributes('link').href as string | undefined;
                    const url = window.prompt('URL', previousUrl ?? '');
                    if (url === null) return; // cancelled
                    if (url === '') {
                      editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    } else {
                      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    }
                  }}
                  className={
                    editor.isActive('link')
                      ? 'px-2 py-1 text-xs font-semibold rounded bg-primary text-primary-foreground'
                      : 'px-2 py-1 text-xs font-semibold rounded hover:bg-accent'
                  }
                >
                  Link
                </button>
              </div>
            </BubbleMenu>
            <EditorContent editor={editor} />
          </>
        )}
      </div>

    </div>
  );
}
