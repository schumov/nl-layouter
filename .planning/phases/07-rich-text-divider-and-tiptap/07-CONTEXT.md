# Phase 7: Rich Text, Divider & TipTap - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 replaces the two remaining Phase 6 stubs (`[rich-text]` and `[divider]` in `ElementRenderer.tsx` and the "Editor available in Phase 7." note in `InspectorPanel.tsx`) with fully functional canvas renderers and InspectorPanel editors. The `RichTextElement` becomes editable via a single live TipTap editor instance mounted conditionally in the InspectorPanel; non-selected rich text elements render via a static HTML renderer. The `DividerElement` gets a styled `<hr>` renderer and a color/thickness/spacing editor.

**In scope:**
- Install `@tiptap/extension-text-align@3.26.0` + `@tiptap/static-renderer@3.26.0`
- Shared `lib/tiptap-extensions.ts` with `RICH_TEXT_EXTENSIONS` array (StarterKit + TextStyleKit + TextAlign)
- `RichTextStaticRenderer.tsx` — canvas display for non-selected rich text (uses `generateHTML()` from `@tiptap/core`)
- `RichTextEditor.tsx` — live TipTap editor (mounted in InspectorPanel only when rich-text selected); BubbleMenu for Bold/Italic/Underline/Link; named preset picker
- `DividerRenderer.tsx` — `<hr>` with inline styles from `DividerElement.color/thickness/spacing`
- `DividerEditor.tsx` — color picker, thickness slider (1–8 px), spacing input wired to `updateElement`
- `ElementRenderer.tsx` update — `case 'rich-text'` dispatches to `RichTextStaticRenderer` (Phase 7 replaces the stub)
- `InspectorPanel.tsx` update — `case 'rich-text'` → `<RichTextEditor>`; `case 'divider'` → `<DividerEditor>`

**Out of scope:**
- Rich text alignment toolbar (TextAlign extension installed but no UI buttons in Phase 7)
- Text color picker in BubbleMenu (extension installed but no UI in Phase 7)
- Font size picker (FontSize available via TextStyleKit but no UI in Phase 7)
- Image/button/list element editing (Phase 6 complete)
- Header/footer/pre-header (Phase 8)
- HTML export (Phase 9)
- Undo/redo v2 history stack

</domain>

<decisions>
## Implementation Decisions

### Package Installation (D-01)
- **D-01:** Install exactly two new packages: `@tiptap/extension-text-align@3.26.0` and `@tiptap/static-renderer@3.26.0`. All other TipTap packages are already installed.
- Install command: `pnpm --filter nl-layouter-client add @tiptap/extension-text-align@3.26.0 @tiptap/static-renderer@3.26.0`

### Extension Configuration — Shared Module (D-02)
- **D-02:** Create `apps/client/src/lib/tiptap-extensions.ts` exporting `RICH_TEXT_EXTENSIONS: Extension[]`. Both `useEditor` (in `RichTextEditor`) and `generateHTML` (in `RichTextStaticRenderer`) MUST use this identical array. Divergence causes silent attribute-loss bugs.
- Extensions in `RICH_TEXT_EXTENSIONS`: `StarterKit`, `TextStyleKit` (from `@tiptap/extension-text-style` — bundles TextStyle + Color + FontSize + FontFamily + LineHeight), `TextAlign.configure({ types: ['heading', 'paragraph'] })`

### CC-2 Compliance (D-03 — KEY RESEARCH FINDING)
- **D-03:** TipTap v3.26.0 already emits inline styles by default. **No `renderHTML` overrides are needed.** Bold/Italic/Underline emit semantic HTML (`<strong>`, `<em>`, `<u>`). Color emits `style="color: X"`. TextAlign emits `style="text-align: X"`. The `has-text-align-*` / `has-color-*` class patterns are a TipTap v2 artifact that does not exist in v3.26.

### RichTextStaticRenderer (D-04)
- **D-04:** Use `generateHTML(element.content, RICH_TEXT_EXTENSIONS)` + `dangerouslySetInnerHTML`. This is safe because the content is produced by TipTap's own JSON serialiser (not user-supplied raw HTML). Wrap output in a `<div>` with `style={PRESET_STYLES[element.textStyle]}` for the named preset typography.
- Do NOT use `@tiptap/static-renderer` for canvas rendering — it is reserved for Phase 9 export.

### Named Text Style Presets (D-05)
- **D-05:** `RichTextElement.textStyle` ('header'|'subheader'|'body'|'code') is an **element-level field** — NOT a TipTap mark. Preset picker dispatches `onUpdate({ textStyle: preset })`. The preset is applied as a CSS wrapper `<div style={PRESET_STYLES[textStyle]}>` around the content.
- Preset CSS map:
  - `header`: `{ fontSize: '28px', fontWeight: '700', lineHeight: '1.2' }`
  - `subheader`: `{ fontSize: '20px', fontWeight: '600', lineHeight: '1.3' }`
  - `body`: `{ fontSize: '16px', fontWeight: '400', lineHeight: '1.6' }`
  - `code`: `{ fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.5' }`

### RichTextEditor — Live Editor (D-06)
- **D-06:** `RichTextEditor` uses `useEditor({ extensions: RICH_TEXT_EXTENSIONS, content: element.content, onUpdate: ({ editor }) => onUpdate({ content: editor.getJSON() }) })`.
- **Do NOT add `useEffect` cleanup** — TipTap v3's `EditorInstanceManager` destroys the editor automatically on unmount.
- BubbleMenu imported from `@tiptap/react/menus` (NOT `@tiptap/react` — breaking change from v2). Uses Floating UI `options` prop (NOT `tippyOptions`):
  ```tsx
  <BubbleMenu editor={editor} options={{ placement: 'top', offset: 8 }} shouldShow={...}>
  ```
- BubbleMenu shows Bold/Italic/Underline/Link toggle buttons only (4 actions, no color/align in Phase 7).

### Editor Lifecycle Guard (D-07)
- **D-07:** Mount `<RichTextEditor>` conditionally in `ElementRenderer`: the component only mounts when the slot is selected. `isSelected` is determined by `element.id === selectedElementId` (read from Zustand).
- **ElementRenderer needs `selectedElementId` passed as a prop** (or read from Zustand directly) to implement this conditional.
- **ONE editor instance constraint** (from STATE.md architecture decision): at any moment, at most one `RichTextEditor` is mounted. Conditional mount in `ElementRenderer` guarantees this.

### DividerRenderer (D-08)
- **D-08:** Render pattern:
  ```tsx
  <div style={{ padding: `${element.spacing}px 0` }}>
    <hr style={{ border: 'none', borderTop: `${element.thickness}px solid ${element.color}`, margin: 0 }} />
  </div>
  ```
- Default values from `DividerElement` defaults when used in `addElement`: `color: '#cccccc'`, `spacing: 16`, `thickness: 1`.
- All styles are inline (no Tailwind color classes) per CC-2/CC-6.

### DividerEditor (D-09)
- **D-09:** Three controls:
  - Color: native `<input type="color">` + hex text Input (same pattern as ButtonEditor)
  - Thickness: `<input type="range" min={1} max={8} step={1}>` slider + numeric display
  - Spacing (top+bottom padding): `<Input type="number" min={0}>` (single value applied to both top and bottom)
- All controls dispatch `onUpdate` immediately on every change (D-07 rule from Phase 6 carries forward).

### ElementRenderer Integration (D-10)
- **D-10:** `ElementRenderer` needs to know `selectedElementId` to implement the lifecycle guard. Pass `selectedElementId: string | null` as a new prop (or use a Zustand selector inside `ElementRenderer`). `ColumnSlot` → `ElementRenderer` prop chain.
- This is a breaking change to `ElementRenderer`'s props — the existing tests may need updating.

### InspectorPanel Integration (D-11)
- **D-11:** Replace the `case 'rich-text': case 'divider':` Phase 7 note in `InspectorPanel.tsx` with:
  - `case 'rich-text': return <RichTextEditor element={element} onUpdate={onUpdate} />;`
  - `case 'divider': return <DividerEditor element={element} onUpdate={onUpdate} />;`
- `RichTextEditor` receives `element` + `onUpdate`; it does NOT need `selectedElementId` (lifecycle guard is in `ElementRenderer`).

### Default Element Values for addElement (D-12)
- **D-12:** When `addElement` is called with `type: 'rich-text'`, the default element is:
  ```ts
  { type: 'rich-text', id: uuid(), content: { type: 'doc', content: [{ type: 'paragraph' }] }, textStyle: 'body' }
  ```
- When `addElement` is called with `type: 'divider'`:
  ```ts
  { type: 'divider', id: uuid(), color: '#cccccc', spacing: 16, thickness: 1 }
  ```
- These defaults need to be added to `useNewsletterStore.ts` `addElement` action (currently only handles image/image-link/button).

### the agent's Discretion
- Exact styling of the BubbleMenu toolbar (button styles, size, border radius)
- Whether to use shadcn `Button` inside BubbleMenu or plain `<button>` elements
- Exact layout of DividerEditor fields (labels, spacing, dividers between sections)
- Whether `RichTextEditor` has a border/focus ring around `<EditorContent>` in the InspectorPanel
- Color swatch + hex input layout in DividerEditor (reuse ButtonEditor pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 7 plans + Done When criteria (ELEM-06..ELEM-09)
- `.planning/REQUIREMENTS.md` — ELEM-06, ELEM-07, ELEM-08, ELEM-09

### Type System (Phase 1 — locked)
- `apps/client/src/types/newsletter.ts` — `RichTextElement { type, id, content: TiptapJSONDoc, textStyle }` + `DividerElement { type, id, color, spacing, thickness }` + `TiptapJSONDoc/TiptapNode` types

### Existing Store (to extend)
- `apps/client/src/store/useNewsletterStore.ts` — `updateElement(slotId, patch)` from Phase 6; `addElement(slotId, type)` needs defaults for 'rich-text' and 'divider' types

### Canvas Components (to modify/extend)
- `apps/client/src/components/builder/ElementRenderer.tsx` — current stubs for rich-text + divider; Phase 7 replaces stubs + adds `selectedElementId` prop for lifecycle guard
- `apps/client/src/components/builder/InspectorPanel.tsx` — Phase 6 has Phase 7 note; Phase 7 replaces with real editors
- `apps/client/src/components/builder/ColumnSlot.tsx` — may need to pass `selectedElementId` to `ElementRenderer`

### Phase 6 Patterns (carry forward)
- `.planning/phases/06-image-and-button-elements/06-CONTEXT.md` — D-07 (no debounce), D-08 (element prop), inline style pattern
- `apps/client/src/components/builder/ButtonEditor.tsx` — color picker pattern (swatch + hex input + hex validation)

### Research Findings
- `.planning/phases/07-rich-text-divider-and-tiptap/07-RESEARCH.md` — TipTap v3.26 API patterns, BubbleMenu breaking change, extension installation, lifecycle decisions

### Architecture Constraints
- `.planning/STATE.md` — "One active TipTap editor instance; static-renderer for rest" (architecture decision locked Phase 7); CC-2 (inline styles only); font-medium forbidden

</canonical_refs>

<specifics>
## Specific Ideas

- **Extension module path:** `apps/client/src/lib/tiptap-extensions.ts` (new `lib/` directory)
- **BubbleMenu import:** `import { BubbleMenu } from '@tiptap/react/menus'` (NOT `@tiptap/react`)
- **BubbleMenu Floating UI API:** `options={{ placement: 'top', offset: 8 }}` (NOT `tippyOptions`)
- **generateHTML import:** `import { generateHTML } from '@tiptap/core'`
- **No renderHTML overrides:** CC-2 is satisfied by TipTap v3 defaults (no custom extensions needed)
- **Default rich-text content:** `{ type: 'doc', content: [{ type: 'paragraph' }] }` (empty paragraph)
- **Preset picker labels:** "Header" / "Subheader" / "Body Text" / "Code"

</specifics>

<deferred>
## Deferred Ideas

- **Text alignment UI buttons:** TextAlign extension is installed and configured in RICH_TEXT_EXTENSIONS but no toolbar buttons are added in Phase 7. Phase 8 or post-launch enhancement.
- **Text color picker in BubbleMenu:** Color extension is included in TextStyleKit but no color UI in Phase 7 BubbleMenu.
- **Font size per selection:** FontSize available via TextStyleKit but no UI exposed in Phase 7.
- **Per-column rich text export:** `@tiptap/static-renderer/json/html-string` pattern documented for Phase 9 use.
- **Undo/redo:** Deferred to v2 per STATE.md.

</deferred>

---

*Phase: 7 — Rich Text, Divider & TipTap*
*Context gathered: 2026-06-08*
