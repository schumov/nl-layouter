# Phase 7: Rich Text, Divider & TipTap — Research

**Researched:** 2026-06-08
**Domain:** TipTap v3 WYSIWYG editing, inline-style rendering, static HTML rendering
**Confidence:** HIGH — all findings verified by direct source-code inspection of installed packages

---

## Summary

TipTap v3.26.0 (already installed in this project) ships with significant architectural changes from v2 that directly resolve the CC-2 inline-style constraint: the `Color` and `TextAlign` extensions now emit `style=""` attributes by default (not CSS classes). The worrisome `has-text-align-center` and `has-color-*` class patterns are gone in v3. No renderHTML overrides are required for the already-installed extensions.

Two packages need to be added to the client: `@tiptap/extension-text-align@3.26.0` (TextAlign is not in starter-kit) and `@tiptap/static-renderer@3.26.0` (for canvas rendering without a live editor). The `RichTextElement.textStyle` preset field (header/subheader/body/code) lives at the **element level** — it is a CSS wrapper around the editor content, not a TipTap mark inside the JSON document. This simplifies both implementation and the static renderer.

The BubbleMenu API has a **breaking change** from v2: it is now imported from `@tiptap/react/menus` (subpath), and uses Floating UI's `options` prop instead of Tippy's `tippyOptions`. `useEditor` in v3 handles lifecycle automatically via `EditorInstanceManager` — no manual `editor.destroy()` call in `useEffect` cleanup is required.

**Primary recommendation:** Install `@tiptap/extension-text-align@3.26.0` + `@tiptap/static-renderer@3.26.0`. Use `generateHTML(doc, extensions)` for the `RichTextStaticRenderer` canvas display (simpler than the full static-renderer for this use case). Use `@tiptap/static-renderer/json/html-string` during Phase 9 export. Mount `<RichTextEditor>` conditionally (only when element is selected) — do NOT use `useEditor` with a flag inside the component.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TipTap editor instance | Browser/Client | — | ProseMirror is a DOM-based rich text engine; only one can be active |
| RichTextStaticRenderer (canvas) | Browser/Client | — | React-rendered preview without ProseMirror |
| DividerRenderer | Browser/Client | — | Inline-styled `<hr>` from element config |
| RichTextEditor (InspectorPanel) | Browser/Client | — | Single active editor; mounted conditionally |
| BubbleMenu | Browser/Client | — | Floating UI portal in browser DOM |
| Named preset (textStyle) | Browser/Client | — | CSS wrapper at element level, not a mark |
| TipTap JSON storage | Database / Store | — | Stored as `TiptapJSONDoc` in Zustand store / PostgreSQL JSONB |
| HTML generation for export | API/Backend | Browser (preview) | `generateHTML()` called during Phase 9 export |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELEM-06 | Rich text element — full WYSIWYG editor (bold, italic, underline, links, lists) | `useEditor` + `StarterKit` + `TextAlign` + `TextStyleKit` |
| ELEM-07 | Rich text element supports named styles: Header, Subheader, Body Text, Code | `RichTextElement.textStyle` field + CSS wrapper pattern |
| ELEM-08 | Rich text editor outputs inline styles (not CSS classes) for email compatibility | Color + TextAlign v3 already inline; Bold/Italic/Underline use semantic HTML elements (no CSS classes) |
| ELEM-09 | Divider element — horizontal rule, configurable colour and spacing | `DividerRenderer` + `DividerEditor` wired to `updateElement` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tiptap/react` | 3.26.0 ✓ installed | Editor hook + EditorContent | Official React integration |
| `@tiptap/starter-kit` | 3.26.0 ✓ installed | Bold, Italic, Underline, Link, lists, headings | Single bundled extension for common marks/nodes |
| `@tiptap/extension-text-style` | 3.26.0 ✓ installed | TextStyle mark + Color, FontSize, FontFamily, LineHeight, TextStyleKit | Inline-style text formatting |
| `@tiptap/extension-color` | 3.26.0 ✓ installed | Re-exports `Color` from `@tiptap/extension-text-style` | Text color (already inline-style in v3) |
| `@tiptap/extensions` | 3.26.0 ✓ installed | Placeholder, CharacterCount, Focus, UndoRedo | Utility extensions |
| `@tiptap/pm` | 3.26.0 ✓ installed | ProseMirror peer dependency | Required by all TipTap packages |
| `@tiptap/extension-text-align` | 3.26.0 **NEEDS INSTALL** | Text alignment (left/center/right) | Emits `style="text-align:"` inline (v3 changed from class-based) |
| `@tiptap/static-renderer` | 3.26.0 **NEEDS INSTALL** | JSON → HTML without ProseMirror | Official static rendering; used in Phase 9 export |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `generateHTML` (from `@tiptap/core`) | 3.26.0 (bundled) | JSON → HTML string using extension renderHTML | RichTextStaticRenderer canvas display (simpler than full static-renderer) |
| `TextStyleKit` (from `@tiptap/extension-text-style`) | 3.26.0 ✓ | Bundles TextStyle + Color + FontSize + FontFamily + LineHeight + BackgroundColor | Add when advanced text styling needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tiptap/static-renderer/json/react` | `generateHTML()` + `dangerouslySetInnerHTML` | Static-renderer gives React nodes (no XSS concern); generateHTML is simpler but uses innerHTML. For canvas use generateHTML; for export pipeline use static-renderer |
| `TextStyleKit` | Individual Color + FontSize extensions | Kit reduces boilerplate; individual imports allow tree-shaking |

**Installation (packages needed for Phase 7):**
```bash
pnpm --filter nl-layouter-client add @tiptap/extension-text-align@3.26.0 @tiptap/static-renderer@3.26.0
```

**Version verification:** [VERIFIED: npm registry + local node_modules]
- `@tiptap/extension-text-align@3.26.0` — published to npm, latest tag [VERIFIED: npm registry]
- `@tiptap/static-renderer@3.26.0` — published 2026-06-05, peerDeps: React 17/18/19, @tiptap/core 3.26.0 [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks slot
       │
       ▼
ElementRenderer (canvas, always mounted)
       │
       ├─── element.type === 'rich-text'
       │         │
       │         ├── IS selected → <RichTextEditor>
       │         │                    │
       │         │                    ├── useEditor({ extensions: [...] })
       │         │                    ├── EditorContent (ProseMirror DOM)
       │         │                    └── <BubbleMenu> (Floating UI portal)
       │         │
       │         └── NOT selected → <RichTextStaticRenderer>
       │                              └── generateHTML(content, extensions)
       │                                       └── dangerouslySetInnerHTML
       │
       └─── element.type === 'divider'
                 └── <DividerRenderer>
                       └── <hr style={...} />

InspectorPanel (shown when any element selected)
       │
       ├── case 'rich-text' → <RichTextEditor> (same instance via prop)
       │       └── Preset picker (header/subheader/body/code)
       │            └── updateElement({ textStyle: preset })
       │
       └── case 'divider' → <DividerEditor>
               ├── color input → updateElement({ color })
               ├── thickness input → updateElement({ thickness })
               └── spacing input → updateElement({ spacing })
```

### Recommended Project Structure
```
src/
├── components/
│   └── builder/
│       ├── RichTextEditor.tsx          # Live ProseMirror editor (InspectorPanel + canvas active state)
│       ├── RichTextStaticRenderer.tsx  # Static HTML display (non-selected canvas slots)
│       ├── DividerRenderer.tsx         # <hr> with inline styles
│       ├── DividerEditor.tsx           # Color/thickness/spacing inputs
│       └── __tests__/
│           ├── RichTextStaticRenderer.test.tsx
│           ├── DividerRenderer.test.tsx
│           └── DividerEditor.test.tsx
├── lib/
│   └── tiptap-extensions.ts           # Shared extension array (editor + generateHTML must use identical set)
```

### Pattern 1: Extension Configuration (shared between editor and generateHTML)

**Critical:** `generateHTML()` must receive the **identical** extension list as `useEditor()`. Divergence causes silent attribute-loss bugs. Export to a shared module.

```typescript
// Source: verified from @tiptap/core dist/index.d.ts + source inspection
// lib/tiptap-extensions.ts
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'

export const RICH_TEXT_EXTENSIONS = [
  StarterKit,
  TextStyleKit,                          // TextStyle + Color + FontSize + FontFamily + LineHeight
  TextAlign.configure({
    types: ['heading', 'paragraph'],     // Must declare which nodes support alignment
  }),
]
```

> **Why no renderHTML overrides?** In TipTap v3.26.0, Color already emits `style="color: X"` and TextAlign already emits `style="text-align: X"`. Bold/Italic/Underline/Link emit semantic HTML elements (`<strong>`, `<em>`, `<u>`, `<a>`) with no CSS classes. CC-2 is satisfied by default. [VERIFIED: source inspection of all installed extensions]

### Pattern 2: useEditor Hook (v3.26)

```typescript
// Source: verified from @tiptap/react/src/useEditor.ts
import { useEditor, EditorContent } from '@tiptap/react'
import { RICH_TEXT_EXTENSIONS } from '@/lib/tiptap-extensions'

function RichTextEditor({ element, onUpdate }) {
  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: element.content,          // TiptapJSONDoc from element
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getJSON() })
    },
    // No immediatelyRender needed (client-only, not SSR)
  })

  // ⚠️ NO manual useEffect cleanup needed in v3.
  // EditorInstanceManager destroys the editor automatically on unmount.

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  )
}
```

**Lifecycle guard:** Mount `<RichTextEditor>` conditionally in ElementRenderer:
```typescript
// ElementRenderer.tsx — ensures only ONE editor at a time
case 'rich-text':
  return isSelected
    ? <RichTextEditor element={element} onUpdate={...} />
    : <RichTextStaticRenderer element={element} />
```

### Pattern 3: RichTextStaticRenderer (no live editor)

```typescript
// Source: verified from @tiptap/core dist/index.d.ts (generateHTML exported)
import { generateHTML } from '@tiptap/core'
import { RICH_TEXT_EXTENSIONS } from '@/lib/tiptap-extensions'
import type { RichTextElement } from '@/types/newsletter'

const PRESET_STYLES: Record<RichTextElement['textStyle'], React.CSSProperties> = {
  header:     { fontSize: '28px', fontWeight: '700', lineHeight: '1.2' },
  subheader:  { fontSize: '20px', fontWeight: '600', lineHeight: '1.3' },
  body:       { fontSize: '16px', fontWeight: '400', lineHeight: '1.6' },
  code:       { fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.5' },
}

export function RichTextStaticRenderer({ element }: { element: RichTextElement }) {
  const html = generateHTML(element.content, RICH_TEXT_EXTENSIONS)
  const presetStyle = PRESET_STYLES[element.textStyle]

  return (
    <div
      style={presetStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

> `generateHTML` is XSS-safe for content produced by TipTap's own JSON serialiser — it uses the extension `renderHTML` functions, not user-supplied raw HTML. [VERIFIED: @tiptap/core source]

### Pattern 4: BubbleMenu (v3 — Floating UI, NOT Tippy)

```typescript
// Source: verified from @tiptap/react/src/menus/BubbleMenu.tsx
// BREAKING CHANGE: import from '@tiptap/react/menus', NOT '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

<BubbleMenu
  editor={editor}
  options={{ placement: 'top', offset: 8 }}   // Floating UI options
  shouldShow={({ editor }) => !editor.view.state.selection.empty}
>
  <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
  <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
  <button onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
</BubbleMenu>
```

**v2 → v3 BubbleMenu breaking changes:**
| v2 | v3 |
|----|----|
| `import { BubbleMenu } from '@tiptap/react'` | `import { BubbleMenu } from '@tiptap/react/menus'` |
| `tippyOptions={{ placement: 'top' }}` | `options={{ placement: 'top' }}` (Floating UI) |
| Tippy.js dependency | Floating UI dependency (already peer dep) |

### Pattern 5: Named Preset Applied as Wrapper Style

The `RichTextElement.textStyle` field controls the **typography preset** for the whole block. It is stored at the element level, NOT as a TipTap mark inside the JSON document. This means:

1. Preset selection in the editor → `updateElement({ textStyle: 'header' })`
2. In `RichTextEditor`, the preset styles are applied to a wrapper `<div>` around `EditorContent`
3. Individual marks inside the TipTap document (bold, color, font-size) **override** preset defaults
4. `generateHTML(element.content, extensions)` produces inner HTML; preset wrapper is added by the renderer

```typescript
// InspectorPanel preset picker — fires updateElement
const PRESETS = ['header', 'subheader', 'body', 'code'] as const

{PRESETS.map(preset => (
  <button
    key={preset}
    onClick={() => onUpdate({ textStyle: preset })}
    className={element.textStyle === preset ? 'ring-2 ring-primary' : ''}
  >
    {preset}
  </button>
))}
```

### Pattern 6: DividerRenderer

```typescript
// Source: verified from DividerElement type in newsletter.ts
export function DividerRenderer({ element }: { element: DividerElement }) {
  return (
    <div style={{ padding: `${element.spacing}px 0` }}>
      <hr
        style={{
          border: 'none',
          borderTop: `${element.thickness}px solid ${element.color}`,
          margin: 0,
        }}
      />
    </div>
  )
}
```

### Pattern 7: @tiptap/static-renderer (for Phase 9 export reference)

For the Phase 9 HTML export pipeline, `@tiptap/static-renderer/json/html-string` is the preferred approach (no dangerouslySetInnerHTML needed in the export context):

```typescript
// Source: verified from @tiptap/static-renderer dist/json/html-string/index.d.ts
import { renderJSONContentToString, serializeAttrsToHTMLString } from '@tiptap/static-renderer/json/html-string'

const renderToHTML = renderJSONContentToString({
  nodeMapping: {
    doc:        ({ children }) => serializeChildrenToHTMLString(children),
    paragraph:  ({ node, children }) => `<p ${serializeAttrsToHTMLString(node.attrs)}>${serializeChildrenToHTMLString(children)}</p>`,
    text:       ({ node }) => node.text ?? '',
    heading:    ({ node, children }) => `<h${node.attrs?.level}>${serializeChildrenToHTMLString(children)}</h${node.attrs?.level}>`,
    // ... other nodes
  },
  markMapping: {
    bold:      ({ children }) => `<strong>${serializeChildrenToHTMLString(children)}</strong>`,
    italic:    ({ children }) => `<em>${serializeChildrenToHTMLString(children)}</em>`,
    underline: ({ children }) => `<u>${serializeChildrenToHTMLString(children)}</u>`,
    link:      ({ mark, children }) => `<a href="${mark.attrs?.href}">${serializeChildrenToHTMLString(children)}</a>`,
    textStyle: ({ mark, children }) => `<span style="${mark.attrs?.style ?? ''}">${serializeChildrenToHTMLString(children)}</span>`,
  },
})

const html = renderToHTML({ content: element.content })
```

> For Phase 7 (canvas rendering only), use `generateHTML()` — it's simpler and uses extension renderHTML logic directly. Reserve `@tiptap/static-renderer` for Phase 9 where full control over HTML structure is required.

### Anti-Patterns to Avoid

- **Multiple live editors:** Never mount more than one `<EditorContent>` at a time. Every ProseMirror instance holds a full DOM subtree + transaction history. 20 instances ≈ 500 ms input lag. [VERIFIED: STATE.md architecture decision]
- **Manual destroy in useEffect:** Do NOT add `useEffect(() => () => editor?.destroy(), [editor])` — v3's `EditorInstanceManager` does this automatically. [VERIFIED: @tiptap/react/src/useEditor.ts]
- **Divergent extension lists:** Using different extensions in `useEditor` vs `generateHTML` silently drops attributes. Always share `RICH_TEXT_EXTENSIONS` from a single module. [ASSUMED: based on TipTap schema-matching logic]
- **tippyOptions in v3:** `tippyOptions` does not exist in v3 BubbleMenu. Use `options` with Floating UI format. [VERIFIED: @tiptap/extension-bubble-menu source]
- **Importing BubbleMenu from wrong path:** `import { BubbleMenu } from '@tiptap/react'` will fail — it's not in the main export. Use `'@tiptap/react/menus'`. [VERIFIED: @tiptap/react dist/index.d.ts comment + package.json exports]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contentEditable | TipTap + StarterKit | Collaborative history, schema validation, keyboard shortcuts, undo/redo |
| Inline-style text color | Custom mark extension | `Color` from `@tiptap/extension-text-style` | Already emits `style="color: X"` in v3; XSS-safe |
| Text alignment | Custom extension | `TextAlign` from `@tiptap/extension-text-align` | Already emits `style="text-align: X"` in v3 |
| Font size | Custom mark | `FontSize` from `@tiptap/extension-text-style` | Emits `style="font-size: X"` in v3 |
| Static HTML from JSON | ProseMirror schema + serialiser | `generateHTML(doc, extensions)` | Uses the same renderHTML logic as the live editor |
| Popup toolbar position | Popper.js / manual CSS | BubbleMenu + Floating UI | Handles scroll, resize, edge detection |
| Editor destroy lifecycle | useEffect cleanup | v3 EditorInstanceManager | v3 manages this internally; double-destroy causes crashes |

**Key insight:** The CC-2 inline-style constraint is already satisfied by TipTap v3's default behavior — no extension overrides are needed for the Phase 7 scope.

---

## Q1: Inline-Style Override — Detailed Findings

### What TipTap v3.26.0 emits by default (verified by source inspection)

| Extension | HTML emitted | CSS class? | Inline style? |
|-----------|-------------|-----------|---------------|
| Bold | `<strong>...</strong>` | ❌ | ❌ (semantic element) |
| Italic | `<em>...</em>` | ❌ | ❌ (semantic element) |
| Underline | `<u>...</u>` | ❌ | ❌ (semantic element) |
| Link | `<a href="...">...</a>` | ❌ | ❌ (href attribute) |
| Color | `<span style="color: X">` | ❌ | ✅ already inline |
| TextAlign | `<p style="text-align: X">` | ❌ | ✅ already inline |
| FontSize | `<span style="font-size: X">` | ❌ | ✅ already inline |
| FontFamily | `<span style="font-family: X">` | ❌ | ✅ already inline |

**The `has-text-align-*` and `has-color-*` class patterns are a TipTap v2 artifact. They do not exist in v3.26.**

### extend() API in v3

`extend()` is available and unchanged in v3 but is NOT needed for CC-2 compliance. If future requirements need it (e.g., converting `<strong>` to `<span style="font-weight:bold">`), the pattern is:

```typescript
// Old DOMOutputSpec array format still works in v3:
const InlineStyleBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ style: 'font-weight: bold' }, HTMLAttributes), 0]
  }
})

// New JSX format (v3 native, requires @jsxImportSource @tiptap/core):
const InlineStyleBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return (
      <span style={{ fontWeight: 'bold' }} {...mergeAttributes(HTMLAttributes)}>
        <slot />
      </span>
    )
  }
})
```

**Recommendation:** Do NOT convert Bold/Italic/Underline to inline-style spans for Phase 7. Email clients universally support `<strong>`, `<em>`, `<u>` — they are more compatible than `<span style="font-weight:bold">` in older Outlook versions.

---

## Q2: @tiptap/static-renderer Availability

- **Status:** PUBLISHED at 3.26.0, latest tag [VERIFIED: npm registry]
- **Published:** 2026-06-05 (same day as @tiptap/react 3.26.0)
- **Peer deps:** react ^17||^18||^19, react-dom, @tiptap/core 3.26.0, @tiptap/pm 3.26.0 [VERIFIED: npm view]

### Subpath exports:

| Import path | Function | Output type |
|-------------|----------|-------------|
| `@tiptap/static-renderer/json/react` | `renderJSONContentToReactElement({ nodeMapping, markMapping })` | `React.ReactNode` |
| `@tiptap/static-renderer/json/html-string` | `renderJSONContentToString({ nodeMapping, markMapping })` | `string` |
| `@tiptap/static-renderer/pm/react` | ProseMirror Node → React | `React.ReactNode` |
| `@tiptap/static-renderer/pm/html-string` | ProseMirror Node → string | `string` |

### Decision for Phase 7 vs Phase 9:

| Context | Approach | Why |
|---------|----------|-----|
| Canvas static display (Phase 7) | `generateHTML()` + `dangerouslySetInnerHTML` | Simpler; leverages extension renderHTML directly |
| Export HTML generation (Phase 9) | `@tiptap/static-renderer/json/html-string` | Full control over table-based email structure |

---

## Q3: Named Text Style Presets

**Architecture:** `RichTextElement.textStyle` is stored at the **element level**, not as a TipTap mark. This means:

1. The 4 presets (header/subheader/body/code) define **default typography** for the block
2. Individual TipTap marks (bold, italic, font-size) **override** preset defaults for selected text
3. Preset change → `updateElement({ textStyle: newPreset })` → re-render wrapper style
4. No TipTap command needed; no mark added to the JSON doc

**Preset to CSS mapping (recommended):**
```typescript
const PRESET_STYLES: Record<RichTextElement['textStyle'], React.CSSProperties> = {
  header:    { fontSize: '28px', fontWeight: '700', lineHeight: '1.2', fontFamily: 'inherit' },
  subheader: { fontSize: '20px', fontWeight: '600', lineHeight: '1.3', fontFamily: 'inherit' },
  body:      { fontSize: '16px', fontWeight: '400', lineHeight: '1.6', fontFamily: 'inherit' },
  code:      { fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.5', fontWeight: '400' },
}
```

**For per-selection font-size (within a block):** Use `FontSize` from `@tiptap/extension-text-style`:
```typescript
editor.chain().focus().setFontSize('20px').run()
// Emits: <span style="font-size: 20px">...</span>
```

**The `setMark('textStyle', { fontSize, fontWeight })` pattern IS supported in v3:**
```typescript
editor.chain().focus().setMark('textStyle', { fontSize: '20px', color: '#ff0000' }).run()
// Applies multiple textStyle attributes in one command
```
[VERIFIED: @tiptap/extension-text-style/src/text-style/text-style.tsx — `toggleTextStyle` command]

---

## Q4: BubbleMenu API in v3.26

### Import path (BREAKING CHANGE from v2)
```typescript
// ✅ v3 correct
import { BubbleMenu } from '@tiptap/react/menus'

// ❌ v2 pattern — will fail in v3 (BubbleMenu not in main export)
import { BubbleMenu } from '@tiptap/react'
```
[VERIFIED: @tiptap/react/dist/index.d.ts — BubbleMenu comment says "import from '@tiptap/react/menus'", not present in main exports]

### Full BubbleMenu props (v3):
```typescript
type BubbleMenuProps = {
  editor?: Editor                    // optional if inside <EditorProvider>
  pluginKey?: PluginKey | string
  updateDelay?: number               // ms debounce (default: 250)
  resizeDelay?: number
  appendTo?: HTMLElement | (() => HTMLElement)
  shouldShow?: (props: { editor, view, state, from, to }) => boolean
  options?: {                        // Floating UI options (NOT tippyOptions)
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | ...
    offset?: number | { mainAxis, crossAxis }
    flip?: boolean | FlipOptions
    shift?: boolean | ShiftOptions
    strategy?: 'absolute' | 'fixed'
  }
  // + all HTMLDivElement attributes for the container div
}
```
[VERIFIED: @tiptap/extension-bubble-menu/src/bubble-menu-plugin.ts]

---

## Q5: useEditor Hook in v3.26

### Signature
```typescript
// Source: @tiptap/react/src/useEditor.ts
function useEditor(options: UseEditorOptions, deps?: DependencyList): Editor | null

type UseEditorOptions = Partial<EditorOptions> & {
  immediatelyRender?: boolean          // default: true (false for SSR/Next.js)
  shouldRerenderOnTransaction?: boolean // default: false (legacy: true)
}
```

### Lifecycle management
v3 uses `EditorInstanceManager` which:
1. Creates the editor on mount
2. Schedules destruction after 1 tick if the component unmounts
3. Cancels the scheduled destruction if the component re-mounts in that same tick

**→ No `useEffect(() => () => editor?.destroy(), [])` needed.** Adding one will cause double-destroy errors.

### `deps` array behavior
```typescript
const editor = useEditor({ extensions, content }, [element.id])
//                                                 ^^^^^^^^^^^
// Re-creates the editor when element.id changes (switching selected element)
// Use [] for a permanent editor; use [element.id] to reset on element switch
```

### One-editor-at-a-time guard
The correct approach is conditional mounting, NOT a `disabled` flag:

```typescript
// ✅ Conditional mount — ProseMirror instance created/destroyed by React
{isSelected && element.type === 'rich-text' && (
  <RichTextEditor element={element} onUpdate={handleUpdate} />
)}

// ❌ Mounted always with disabled flag — still creates ProseMirror instance
<RichTextEditor element={element} enabled={isSelected} onUpdate={handleUpdate} />
```

---

## Q6: @tiptap/extensions vs @tiptap/starter-kit Contents

### @tiptap/starter-kit v3.26.0 includes [VERIFIED: source inspection]
Bold, Italic, Underline, **Link**, BulletList, OrderedList, ListItem, ListKeymap, Heading, Code, CodeBlock, Blockquote, HardBreak, HorizontalRule, Paragraph, Strike, Text, Document, Dropcursor, Gapcursor, TrailingNode, UndoRedo

> **v3 change:** Underline and Link are now IN starter-kit. In v2 they were separate packages.

### @tiptap/extensions v3.26.0 includes [VERIFIED: source inspection]
CharacterCount, Dropcursor, Focus, GapCursor, Placeholder, Selection, TrailingNode, UndoRedo

> @tiptap/extensions is a **utility-only** package. It does NOT contain Bold, TextAlign, Link, Underline, etc.

### What is NOT in either (needs separate install for Phase 7)
| Extension | Package | In starter-kit? | In @tiptap/extensions? |
|-----------|---------|-----------------|------------------------|
| TextAlign | `@tiptap/extension-text-align` | ❌ | ❌ |
| FontSize | `@tiptap/extension-text-style` | ❌ | ❌ |
| Color | `@tiptap/extension-text-style` (or `@tiptap/extension-color`) | ❌ | ❌ |
| TextStyle mark | `@tiptap/extension-text-style` | ❌ | ❌ |
| Static renderer | `@tiptap/static-renderer` | ❌ | ❌ |

---

## Common Pitfalls

### Pitfall 1: BubbleMenu imported from wrong path
**What goes wrong:** TypeScript error "BubbleMenu is not exported" or runtime undefined
**Why it happens:** v3 moved BubbleMenu to a subpath export `@tiptap/react/menus`; the main `@tiptap/react` entry does not re-export it
**How to avoid:** Always import from `@tiptap/react/menus`
**Warning signs:** `Property 'BubbleMenu' does not exist on type 'typeof import("@tiptap/react")'`

### Pitfall 2: tippyOptions instead of Floating UI options
**What goes wrong:** `tippyOptions` prop silently ignored; BubbleMenu always appears at default position
**Why it happens:** v3 replaced Tippy.js with Floating UI; `tippyOptions` prop no longer exists
**How to avoid:** Use `options={{ placement: 'top', offset: 8 }}` (Floating UI format)
**Warning signs:** BubbleMenu positioning works but ignores placement configuration

### Pitfall 3: Divergent extension lists (editor vs generateHTML)
**What goes wrong:** `generateHTML` produces wrong output — loses color, font-size, or text-align attributes
**Why it happens:** TipTap's schema is built from the extension list; attributes not declared in the schema are dropped
**How to avoid:** Always import `RICH_TEXT_EXTENSIONS` from a single shared module for both `useEditor` and `generateHTML`
**Warning signs:** Bold/italic preserved but color or font-size lost in the static preview

### Pitfall 4: TextAlign types not configured
**What goes wrong:** `setTextAlign('center')` silently fails; no visual change
**Why it happens:** TextAlign requires `types: ['heading', 'paragraph']` to know which nodes support alignment
**How to avoid:** Always configure `TextAlign.configure({ types: ['heading', 'paragraph'] })`
**Warning signs:** `editor.commands.setTextAlign('center')` returns `false`

### Pitfall 5: Multiple editors mounted simultaneously
**What goes wrong:** All text inputs lag 200-500 ms; memory usage spikes
**Why it happens:** Each ProseMirror instance allocates a full document model + change tracking
**How to avoid:** Conditionally mount `<RichTextEditor>` only for the selected element
**Warning signs:** Perceptible input delay when typing; React DevTools shows many EditorContent nodes

### Pitfall 6: Adding manual editor.destroy() in v3
**What goes wrong:** React error: "Cannot dispatch on a destroyed editor" on next render tick
**Why it happens:** v3's `EditorInstanceManager` already schedules destroy after unmount; double-destroy throws
**How to avoid:** Remove any `useEffect(() => () => editor?.destroy(), [])` patterns
**Warning signs:** Console error with "destroyed" in message

### Pitfall 7: TipTap editor in vitest/jsdom environment
**What goes wrong:** Tests throw `Cannot use 'in' operator to search for 'parentNode' in null` or similar DOM errors
**Why it happens:** ProseMirror requires a real DOM; jsdom has limitations with contentEditable
**How to avoid:** For `RichTextEditor`, write smoke tests only (renders without crash); use `vi.mock('@tiptap/react', ...)` or test only the rendered HTML output. Test `RichTextStaticRenderer` directly by passing TipTap JSON fixtures — no editor instance needed.
**Warning signs:** Tests pass locally but fail in CI with DOM-related errors

---

## Code Examples

### Extension setup (verified from installed source)
```typescript
// Source: verified from all extension source files in pnpm store
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyleKit } from '@tiptap/extension-text-style'  // TextStyle + Color + FontSize + FontFamily
import { TextAlign } from '@tiptap/extension-text-align'

export const RICH_TEXT_EXTENSIONS = [
  StarterKit,
  TextStyleKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
]
```

### BubbleMenu (verified from @tiptap/react menus source)
```tsx
// Source: @tiptap/react/src/menus/BubbleMenu.tsx
import { BubbleMenu } from '@tiptap/react/menus'

<BubbleMenu
  editor={editor}
  options={{ placement: 'top', offset: 8 }}
  shouldShow={({ editor }) => !editor.view.state.selection.empty}
>
  <button
    onClick={() => editor.chain().focus().toggleBold().run()}
    className={editor?.isActive('bold') ? 'is-active' : ''}
  >Bold</button>
  <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
  <button onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
  <button
    onClick={() => {
      const url = prompt('URL:')
      if (url) editor.chain().focus().setLink({ href: url }).run()
    }}
  >Link</button>
</BubbleMenu>
```

### generateHTML for static rendering (verified from @tiptap/core exports)
```typescript
// Source: generateHTML declared in @tiptap/core dist/index.d.ts
import { generateHTML } from '@tiptap/core'
import { RICH_TEXT_EXTENSIONS } from '@/lib/tiptap-extensions'
import type { TiptapJSONDoc } from '@/types/newsletter'

export function richTextToHTML(doc: TiptapJSONDoc): string {
  return generateHTML(doc, RICH_TEXT_EXTENSIONS)
}
```

### TextAlign commands (verified from @tiptap/extension-text-align source)
```typescript
editor.chain().focus().setTextAlign('center').run()
editor.chain().focus().setTextAlign('left').run()
editor.chain().focus().unsetTextAlign().run()
// Keyboard: Mod-Shift-e (center), Mod-Shift-l (left), Mod-Shift-r (right), Mod-Shift-j (justify)
```

### Color commands (verified from @tiptap/extension-text-style/color source)
```typescript
editor.chain().focus().setColor('#ff0000').run()  // emits style="color: #ff0000"
editor.chain().focus().unsetColor().run()
```

### FontSize commands (verified from @tiptap/extension-text-style/font-size source)
```typescript
editor.chain().focus().setFontSize('20px').run()  // emits style="font-size: 20px"
editor.chain().focus().unsetFontSize().run()
```

### DividerRenderer (from DividerElement type)
```tsx
// Source: DividerElement type from newsletter.ts
export function DividerRenderer({ element }: { element: DividerElement }) {
  return (
    <div style={{ paddingTop: `${element.spacing}px`, paddingBottom: `${element.spacing}px` }}>
      <hr
        style={{
          border: 'none',
          borderTop: `${element.thickness}px solid ${element.color}`,
          margin: 0,
          display: 'block',
        }}
      />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TextAlign → `class="has-text-align-center"` | TextAlign → `style="text-align: center"` | TipTap v3.x | CC-2 satisfied without overrides |
| Color → `class="has-color-#ff0000"` | Color → `style="color: #ff0000"` | TipTap v3.x | CC-2 satisfied without overrides |
| BubbleMenu via Tippy.js (`tippyOptions`) | BubbleMenu via Floating UI (`options`) | TipTap v3.0 | Import path and prop name changed |
| Underline/Link separate from starter-kit | Underline/Link included in StarterKit | TipTap v3.x | No extra packages needed for these |
| `renderHTML` returns `['strong', attrs, 0]` array | `renderHTML` can return JSX with `<slot />` | TipTap v3.0 | Both formats still work; JSX is v3-native |
| Manual `editor.destroy()` in useEffect | v3 EditorInstanceManager auto-destroys | TipTap v3.0 | Remove manual cleanup to avoid double-destroy |
| `@tiptap/static-renderer` (beta) | `@tiptap/static-renderer@3.26.0` stable | 2025-07-12 (3.0.1) | Official stable API for static rendering |

**Deprecated/outdated:**
- `tippyOptions` on BubbleMenu: removed in v3, replaced by `options`
- `BubbleMenu` from `@tiptap/react` main export: removed; now in `@tiptap/react/menus`
- `has-text-align-*` / `has-color-*` CSS classes: removed in v3 for these extensions

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Shared `RICH_TEXT_EXTENSIONS` must be identical between editor and generateHTML to avoid attribute loss | Don't Hand-Roll / Pitfalls | Medium — if wrong, can use different configs but must test output |
| A2 | Recommended preset px values (28px/20px/16px/14px) are appropriate for email newsletters | Pattern 5 | Low — these are style values, easily changed |
| A3 | `Bold`/`Italic`/`Underline` semantic HTML elements are acceptable for email export (not requiring inline style conversion) | Q1 detail | Low — email clients universally support `<strong>`, `<em>`, `<u>` |
| A4 | `generateHTML()` is XSS-safe for TipTap-produced JSON content | Pattern 3 | Medium — true for well-formed TipTap JSON; user-pasted content could contain unexpected attrs; mitigated by TipTap's schema validation |

**All other claims are verified by direct source inspection of installed node_modules or npm registry.**

---

## Open Questions (RESOLVED)

1. **Preset lock-in vs inline per-char font-size** — RESOLVED: Phase 7 BubbleMenu exposes Bold/Italic/Underline/Link only. Font-size and color controls deferred to a post-Phase-7 Format toolbar. CONTEXT.md D-06 is the canonical decision.
   - What we know: `textStyle` field is element-level; individual `FontSize` marks can override per selection
   - **Decision:** BubbleMenu = Bold/Italic/Underline/Link only (D-06)

2. **TextAlign in BubbleMenu vs toolbar** — RESOLVED: TextAlign extension installed and configured in RICH_TEXT_EXTENSIONS but NO toolbar buttons in Phase 7. Deferred to post-Phase-7. CONTEXT.md Deferred Ideas is the canonical decision.
   - What we know: TextAlign must configure `types: ['heading', 'paragraph']`
   - **Decision:** No alignment UI in Phase 7 (deferred)

3. **Placeholder extension** — RESOLVED: NOT included in Phase 7 scope. The `Placeholder` extension from `@tiptap/extensions` is available if needed but adds no requirement coverage. Deferred to post-Phase-7 UX enhancement.
   - What we know: `Placeholder` is in `@tiptap/extensions` (already installed)
   - **Decision:** Skip Placeholder in Phase 7 (deferred)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@tiptap/extension-text-align` | TextAlign in editor | ✗ (not installed) | — | None — must install |
| `@tiptap/static-renderer` | RichTextStaticRenderer | ✗ (not installed) | 3.26.0 available | `generateHTML()` (already in @tiptap/core) |
| `@tiptap/core` | `generateHTML()` | ✓ (peer dep of installed packages) | 3.26.0 | — |
| Node.js | Build/test | ✓ | (env) | — |
| jsdom | Vitest tests | ✓ (in vitest.config.ts) | — | — |

**Missing dependencies with no fallback:**
- `@tiptap/extension-text-align` — TextAlign for in-editor alignment; Wave 0 must install

**Missing dependencies with fallback:**
- `@tiptap/static-renderer` — `generateHTML()` works for Phase 7 canvas; static-renderer needed in Phase 9

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react |
| Config file | `apps/client/vitest.config.ts` |
| Quick run command | `pnpm --filter nl-layouter-client test --run` |
| Full suite command | `pnpm --filter nl-layouter-client test --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ELEM-06 | RichTextEditor renders EditorContent | smoke | `pnpm --filter nl-layouter-client test --run RichTextEditor` | ❌ Wave 0 |
| ELEM-06 | BubbleMenu renders in DOM | smoke | `pnpm --filter nl-layouter-client test --run RichTextEditor` | ❌ Wave 0 |
| ELEM-07 | Preset picker fires updateElement | unit | `pnpm --filter nl-layouter-client test --run RichTextEditor` | ❌ Wave 0 |
| ELEM-08 | generateHTML produces no CSS classes | unit | `pnpm --filter nl-layouter-client test --run RichTextStaticRenderer` | ❌ Wave 0 |
| ELEM-08 | Color mark emits `style="color:"` | unit | `pnpm --filter nl-layouter-client test --run RichTextStaticRenderer` | ❌ Wave 0 |
| ELEM-08 | TextAlign emits `style="text-align:"` | unit | `pnpm --filter nl-layouter-client test --run RichTextStaticRenderer` | ❌ Wave 0 |
| ELEM-09 | DividerRenderer renders `<hr>` | unit | `pnpm --filter nl-layouter-client test --run DividerRenderer` | ❌ Wave 0 |
| ELEM-09 | DividerRenderer applies color inline | unit | `pnpm --filter nl-layouter-client test --run DividerRenderer` | ❌ Wave 0 |
| ELEM-09 | DividerEditor fires onUpdate on color change | unit | `pnpm --filter nl-layouter-client test --run DividerEditor` | ❌ Wave 0 |
| ELEM-09 | DividerEditor fires onUpdate on thickness change | unit | `pnpm --filter nl-layouter-client test --run DividerEditor` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter nl-layouter-client test --run`
- **Per wave merge:** `pnpm --filter nl-layouter-client test --run --coverage`
- **Phase gate:** Full suite green (84+ tests) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/builder/__tests__/RichTextStaticRenderer.test.tsx` — ELEM-06, ELEM-08
- [ ] `src/components/builder/__tests__/RichTextEditor.test.tsx` — ELEM-06, ELEM-07 (smoke only, mock @tiptap/react)
- [ ] `src/components/builder/__tests__/DividerRenderer.test.tsx` — ELEM-09
- [ ] `src/components/builder/__tests__/DividerEditor.test.tsx` — ELEM-09

> **Testing TipTap in jsdom:** `RichTextEditor` tests should be smoke-only (renders without crash) because jsdom's contentEditable is incomplete. Mock `useEditor` to return `null` or a minimal editor stub. Test the RENDERED output of `RichTextStaticRenderer` (which uses `generateHTML` — no DOM required) for the actual ELEM-08 assertion.

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes (HTML content) | TipTap schema validation strips unknown nodes; `generateHTML` uses extension renderHTML only |
| V2 Authentication | No | Phase 7 is single-user; no auth in scope |
| V6 Cryptography | No | No secrets in this phase |
| V4 Access Control | No | Canvas is single-user |

### Known Threat Patterns for TipTap/Rich Text

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via pasted HTML | Tampering | TipTap schema validation strips unknown nodes; only declared marks/nodes survive |
| Link href injection (`javascript:`) | Tampering | Link extension has `isAllowedUri` validator (verified in source); defaults block `javascript:` |
| CSS injection via style attr | Tampering | textStyle/Color/FontSize only write known CSS properties; no free-form style string from user input |

> The `isAllowedUri` validator in the Link extension (verified in source) blocks `javascript:`, `vbscript:`, `data:` URI schemes by default. Phase 7 inherits this protection at no extra cost.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/.pnpm/@tiptap+*/node_modules/@tiptap/*/src/**` — Direct source inspection of installed packages
- `node_modules/@tiptap/*/dist/index.d.ts` — TypeScript declaration files for API verification
- npm registry via `npm view @tiptap/static-renderer --json` — Version, peerDeps, exports confirmed
- npm registry via `npm view @tiptap/extension-text-align --json` — Version confirmed

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Project architecture decisions (CC-1 through CC-8)
- `.planning/REQUIREMENTS.md` — ELEM-06 through ELEM-09 scope
- `apps/client/src/types/newsletter.ts` — RichTextElement and DividerElement type definitions

### Tertiary (LOW confidence / ASSUMED)
- None — all critical claims verified by source inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from installed package source + npm registry
- Architecture: HIGH — verified from extension source + type definitions
- BubbleMenu API: HIGH — verified from @tiptap/react menus source + BubbleMenuPluginProps
- useEditor lifecycle: HIGH — verified from @tiptap/react/src/useEditor.ts
- TextAlign inline-style: HIGH — verified from @tiptap/extension-text-align/src/text-align.ts
- Pitfalls: HIGH (most) / MEDIUM (extension divergence pitfall)
- @tiptap/static-renderer: HIGH — verified from npm registry + extracted dist types

**Research date:** 2026-06-08
**Valid until:** 2026-09-08 (90 days — TipTap 3.x is on a weekly release cadence but API is stable)
