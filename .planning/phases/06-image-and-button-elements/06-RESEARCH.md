# Phase 6: Image & Button Elements — Research

**Researched:** 2026-06-08
**Domain:** React component authoring — canvas element renderers + InspectorPanel editors + Zustand store extension
**Confidence:** HIGH — entire codebase read, all prior phase patterns verified, all types confirmed

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Empty `ImageElement` state (src === '') shows branded placeholder: `Image` lucide icon centred + "Add image URL" text beneath. Background: `bg-accent`.
- **D-02:** Minimum height for image slots: **70px** (`min-h-[70px]`). Applies to both empty-state and rendered `<img>`.
- **D-03:** Width field is a **free-form text field** — user types `100%` or `300px`. Default: `100%`. No number+unit toggle.
- **D-04:** Width field label: "Width", placeholder: `e.g. 100% or 300px`. No validation — raw string stored in `ImageElement.width`.
- **D-05:** Phase 6 implements **two** button style variants: `solid` (filled) and `outline`. Ghost is NOT rendered or available in the editor.
- **D-06:** Style picker: segmented button group (two side-by-side shadcn Buttons). `variant="outline"` = inactive; `variant="default"` = active. Labels: "Filled" | "Outline".
- **D-07:** All editor fields dispatch `updateElement` on **every `onChange`** — no debounce. Auto-save (1500ms) in Zustand subscription handles persistence.
- **D-08:** InspectorPanel prop changes from `elementType: ElementUnion['type']` to `element: ElementUnion`. Full element object passed so editors read current values directly from props.
- **D-09:** `BuilderPage` extends `selectedElementType` selector to pass the full element object to InspectorPanel as `element={selectedElement}`.
- **D-10:** `ImageRenderer` renders `<img>` when `src` is non-empty; shows empty-state (D-01) when `src === ''`.
- **D-11:** `ImageLinkRenderer` wraps `ImageRenderer` in `<a>` with an absolute `ExternalLink` badge (top-right, `data-builder-only="true"`). Badge hidden in export.
- **D-12:** `ButtonRenderer` uses **inline styles only** (not Tailwind classes) for all configurable colours — CC-2/CC-6 email compatibility.

### the agent's Discretion
- Exact padding/border-radius for image placeholder frame (resolved in UI-SPEC: `rounded gap-1 p-4`).
- ExternalLink badge exact sizing and positioning (resolved in UI-SPEC: `absolute top-1 right-1`, `size-[14px]`).
- Whether `ButtonRenderer` uses `<button>` or `<a>` tag in builder (resolved in UI-SPEC: `<a>` for export preview accuracy).
- Layout of editor fields within `ImageEditor` and `ButtonEditor` (resolved in UI-SPEC).
- Whether colour pickers show hex text alongside native `<input type="color">` (resolved: yes, per ROADMAP).
- Editor file location: flat in `builder/` vs `builder/editors/` subdirectory (recommendation: flat, see below).

### Deferred Ideas (OUT OF SCOPE)
- Image crop/zoom controls (post-Phase 7 enhancement).
- `ghost` button style implementation.
- Preset colour swatches using `GlobalStyles.primaryColor`.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELEM-01 | Image element — displays image from URL, with configurable width | ImageRenderer + ImageEditor in this phase |
| ELEM-02 | Image element supports alt text input | `alt` field in ImageEditor, passed to `<img alt=...>` |
| ELEM-03 | Image-with-link element — image wrapped in a hyperlink (URL configurable) | ImageLinkRenderer + ImageEditor `href` field |
| ELEM-04 | Button element — configurable label, link URL, background colour, text colour | ButtonRenderer + ButtonEditor in this phase |
| ELEM-05 | At least 2 button style presets (e.g. filled, outline) | ButtonRenderer solid/outline + style toggle in ButtonEditor |
</phase_requirements>

---

## Summary

Phase 6 is a pure frontend component authoring phase — no backend changes required. All foundational architecture is already in place: TypeScript types (`ImageElement`, `ImageLinkElement`, `ButtonElement`) are locked from Phase 1, the Zustand store with Immer is wired from Phase 5, `shadcn/ui` components (`Input`, `Button`) are already installed, and `lucide-react` icons are available. The phase's entire scope is: (1) add one store action (`updateElement`), (2) create three canvas renderer components, (3) create two inspector editor components, (4) upgrade three existing files (ElementRenderer dispatch switch, InspectorPanel prop + routing, BuilderPage selector).

The most critical planning risk is the **InspectorPanel prop signature breaking change** (D-08): the existing Phase 5 `InspectorPanel.test.tsx` uses `elementType` prop, which Phase 6 removes. Wave 0 must update this test file before Wave 3 implementation, or 46 currently-passing tests will regress. A second breaking risk is the **ColumnSlot test text stub** — `ColumnSlot.test.tsx` checks for `'[image]'` from the current ElementRenderer stub; when Phase 6 replaces ElementRenderer, this test breaks. Both must be addressed in Wave 0.

The `setElement` action in `useNewsletterStore.ts` carries a `@deprecated` comment stating "remove in Phase 6". Verified it has no callers outside its own definition — safe to remove in the `updateElement` plan.

**Primary recommendation:** Follow the established TDD wave structure (Wave 0 RED stubs → parallel implementation waves → wiring wave). Target 7 plans: 06-00 (Wave 0 test stubs) + 6 implementation plans across 3 waves.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Image canvas display | Browser/Client (React component) | — | Pure UI render from element props |
| Image-link canvas display | Browser/Client (React component) | — | Wraps ImageRenderer in `<a>` tag |
| Button canvas display | Browser/Client (React component) | — | Inline-style colour application for email preview |
| Image/button editor UI | Browser/Client (React component) | — | Controlled inputs reading/writing element props |
| Element update persistence | Zustand store (client state) | Auto-save hook (debounced API call) | Zustand holds live state; useAutoSave handles server persistence |
| Type routing (ElementRenderer) | Browser/Client (switch dispatcher) | — | Dispatch by discriminated union type |
| Inspector panel routing | Browser/Client (InspectorPanel) | — | Routes to typed editor by element.type |
| Builder page wiring | Browser/Client (BuilderPage) | — | Connects store selectors to InspectorPanel props |

---

## Standard Stack

### Core (all already installed — VERIFIED from codebase)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | 19.2.7 | Component rendering | ✅ installed |
| TypeScript | 6.0.3 | Type safety | ✅ installed |
| Tailwind CSS | 4.3.0 | Utility classes (structural only in renderers) | ✅ installed |
| Zustand | 5.0.14 | Canvas state management | ✅ installed, store extends |
| Immer (via zustand/middleware/immer) | bundled | Mutable state mutations | ✅ installed, Object.assign pattern locked |
| shadcn/ui Button | installed Phase 2 | Style toggle segmented group | ✅ installed, variants confirmed |
| shadcn/ui Input | installed Phase 2 | Editor text fields | ✅ installed |
| lucide-react | installed Phase 1/5 | `Image`, `ExternalLink` icons | ✅ installed, confirmed used in BuilderPalette |

### Supporting (built-ins — no install needed)

| Feature | Type | Purpose |
|---------|------|---------|
| `<input type="color">` | Native HTML5 | Colour swatch picker in ButtonEditor |
| `crypto.randomUUID()` | Browser API | Already used in createDefaultElement |
| `Object.assign()` | JS built-in | Immer patch merge in updateElement |

### No New Dependencies
Phase 6 requires **zero new npm installs**. All required packages are already in `apps/client/package.json`. [VERIFIED: package.json + component directory confirmed]

---

## Architecture Patterns

### System Architecture Diagram

```
User types in editor field
         │
         ▼
  [ImageEditor / ButtonEditor]
  onChange → onUpdate(patch)
         │
         ▼
  [InspectorPanel]
  forwards to BuilderPage callback
         │
         ▼
  [BuilderPage]
  updateElement(selectedElementId, patch)
         │
         ▼
  [useNewsletterStore]
  Immer: Object.assign(slot.element, patch)
         │
         ├──▶ [ElementRenderer → ImageRenderer / ButtonRenderer]
         │    re-renders from updated store state
         │
         └──▶ [useAutoSave]
              1500ms debounce → PUT /newsletters/:id
```

### Recommended File Structure

```
apps/client/src/components/builder/
├── ElementRenderer.tsx          # ← MODIFY: stub → dispatch switch
├── ImageRenderer.tsx            # ← NEW: image display
├── ImageLinkRenderer.tsx        # ← NEW: image-link display
├── ButtonRenderer.tsx           # ← NEW: button display
├── ImageEditor.tsx              # ← NEW: image/image-link fields
├── ButtonEditor.tsx             # ← NEW: button fields
├── InspectorPanel.tsx           # ← MODIFY: prop change + routing
├── __tests__/
│   ├── InspectorPanel.test.tsx  # ← MODIFY: update prop signature
│   ├── ColumnSlot.test.tsx      # ← MODIFY: update [image] stub text
│   ├── ElementRenderer.test.tsx # ← NEW or add to existing
│   ├── ImageRenderer.test.tsx   # ← NEW
│   ├── ImageLinkRenderer.test.tsx # ← NEW
│   ├── ButtonRenderer.test.tsx  # ← NEW
│   ├── ImageEditor.test.tsx     # ← NEW
│   └── ButtonEditor.test.tsx    # ← NEW

apps/client/src/store/
├── useNewsletterStore.ts        # ← MODIFY: add updateElement, remove setElement
└── __tests__/
    └── useNewsletterStore.test.ts # ← MODIFY: add updateElement RED stubs

apps/client/src/pages/
└── BuilderPage.tsx              # ← MODIFY: selector extension + wiring
```

**Editor file location decision:** Keep editors flat in `builder/` (not a `builder/editors/` subdirectory) to match all existing builder component conventions. [VERIFIED: no `editors/` directory exists; all builder files are flat]

### Pattern 1: Renderer Empty-State Gate

```typescript
// Source: D-10, confirmed in UI-SPEC ImageRenderer section
export function ImageRenderer({ element }: { element: ImageElement }) {
  if (!element.src) {
    return (
      <div className="min-h-[70px] flex flex-col items-center justify-center bg-accent rounded gap-1 p-4">
        <Image className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Add image URL</span>
      </div>
    );
  }
  return (
    <img
      src={element.src}
      alt={element.alt}
      className="block min-h-[70px] w-full"
      style={{ width: element.width ?? '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}
```

**Note:** Use `!element.src` (falsy) not strict `=== ''` to handle fixture/test edge cases where `src` may be `undefined` (TypeScript type says `string` but tests pass `as any`).

### Pattern 2: updateElement — Immer Object.assign

```typescript
// Source: UI-SPEC section 9, STATE.md CC Immer pattern
updateElement: (slotId, patch) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      for (const slot of row.slots) {
        if (slot.id === slotId && slot.element) {
          Object.assign(slot.element, patch);  // in-place Immer mutation
          return;  // early exit — avoid scanning remaining slots
        }
      }
    }
  }),
```

**Why `Object.assign` and NOT spread:** Immer proxies must be mutated in-place. `slot.element = { ...slot.element, ...patch }` creates a new object assignment; Immer tracks this differently (works, but inconsistent with established `duplicateSection` vs `removeSection` split). `Object.assign` is the canonical Immer nested-mutation pattern. [VERIFIED from UI-SPEC note + STATE.md]

### Pattern 3: ButtonRenderer Ghost Fallback

```typescript
// Source: UI-SPEC ButtonRenderer section, D-05
switch (element.style) {
  case 'ghost':  // D-05: ghost NOT in Phase 6 editor — fall through to solid as safe default
  case 'solid':
    return <a style={{ backgroundColor: element.backgroundColor, color: element.textColor, ... }}>...</a>;
  case 'outline':
    return <a style={{ backgroundColor: 'transparent', color: element.backgroundColor, border: `2px solid ${element.backgroundColor}`, ... }}>...</a>;
}
```

**Never use `assertNeverElement` for `ghost`** — ghost is a valid type value that may already be stored; it must render without throwing.

### Pattern 4: ElementRenderer Dispatch Switch

```typescript
// Source: UI-SPEC ElementRenderer section
import { assertNeverElement } from '../../types/newsletter';

switch (element.type) {
  case 'image':      return <ImageRenderer element={element} />;
  case 'image-link': return <ImageLinkRenderer element={element} />;
  case 'button':     return <ButtonRenderer element={element} />;
  case 'rich-text':
    return <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">[rich-text]</div>;
  case 'divider':
    return <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">[divider]</div>;
  default:
    return assertNeverElement(element);
}
```

**`assertNeverElement` already imported in store** — re-export available from `types/newsletter.ts`. [VERIFIED: useNewsletterStore.ts imports it]

### Pattern 5: InspectorPanel Upgraded Prop Signature

```typescript
// Source: UI-SPEC InspectorPanel section, D-08
interface InspectorPanelProps {
  element: ElementUnion;
  onBack:   () => void;
  onUpdate: (patch: Partial<ElementUnion>) => void;
}

// Body routing:
switch (element.type) {
  case 'image':
  case 'image-link':
    return <ImageEditor element={element} onUpdate={onUpdate} />;
  case 'button':
    return <ButtonEditor element={element} onUpdate={onUpdate} />;
  case 'rich-text':
  case 'divider':
    return <div className="p-4"><p className="text-sm text-muted-foreground">Editor available in Phase 7.</p></div>;
  default:
    return assertNeverElement(element);
}
```

### Pattern 6: BuilderPage Selector Extension

```typescript
// Source: UI-SPEC BuilderPage section, D-09
// Replace selectedElementType with selectedElement (full object):
const selectedElement = useNewsletterStore((state) => {
  if (!state.selectedElementId || !state.doc) return null;
  for (const row of state.doc.rows) {
    for (const slot of row.slots) {
      if (slot.id === state.selectedElementId && slot.element) {
        return slot.element;
      }
    }
  }
  return null;
});
const updateElement = useNewsletterStore((s) => s.updateElement);

// JSX:
{selectedElementId && selectedElement
  ? <InspectorPanel element={selectedElement} onBack={() => setSelectedElement(null)} onUpdate={(patch) => updateElement(selectedElementId, patch)} />
  : <BuilderPalette />
}
```

**Fallback guard:** `selectedElementId !== null && selectedElement === null` (slot emptied while selected) → falls through to `<BuilderPalette />` — correct behaviour. [VERIFIED from UI-SPEC]

### Pattern 7: Color Picker + Hex Input Sync (ButtonEditor)

```typescript
// Source: UI-SPEC ButtonEditor section
// Both inputs read from element prop (controlled). Both dispatch immediately (D-07).
<div className="flex items-center gap-2">
  <input
    type="color"
    value={element.backgroundColor}
    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
    aria-label="Background color swatch"
  />
  <Input
    value={element.backgroundColor}
    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
    className="font-mono text-xs h-8 w-[88px]"
    maxLength={7}
  />
</div>
```

**No local state needed** — element prop is the single source of truth. Mid-type invalid hex (e.g., `"#0"`) is acceptable; `<input type="color">` ignores invalid values. [VERIFIED from UI-SPEC notes]

### Anti-Patterns to Avoid

- **Template literal class names:** `className={\`min-h-[\${height}]\`}` — FORBIDDEN. Tailwind v4 JIT scanner won't find these. Use complete static strings only.
- **`font-medium` class:** FORBIDDEN project-wide. Only `font-semibold` for emphasis.
- **Tailwind colour classes for configurable colours:** `bg-[#0066cc]` — FORBIDDEN for user-configured values. Use `style={{ backgroundColor: element.backgroundColor }}`.
- **`structuredClone(draft)` without `current()`:** Immer proxies are not serializable. Use `structuredClone(current(draft))` if you need to clone. (Not needed in `updateElement`, only in `duplicateSection`.)
- **`assertNeverElement` on `ghost` button style:** Ghost is a valid stored value. Handle it with a fall-through to solid, not an exhaustiveness error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Colour swatch input | Custom colour picker component | Native `<input type="color">` | Browser native, zero deps, works everywhere; edge cases (invalid hex, OS dialog) handled by browser |
| Editor text fields | Custom input component | shadcn `Input` (already installed) | Consistent design, accessible, focus ring, placeholder, already in codebase |
| Style toggle | Custom radio group or select | shadcn `Button` with variant prop | D-06 specifies this pattern; already installed; `variant="default"` / `variant="outline"` gives correct visual state |
| Immer nested merge | Custom deep merge function | `Object.assign(slot.element, patch)` | Immer tracks in-place mutations; no utility needed |
| Element type names | Hardcoded strings in renderers | Import `ELEMENT_NAMES` from `BuilderPalette.tsx` | Already exported, already used by InspectorPanel; single source of truth |

---

## Common Pitfalls

### Pitfall 1: InspectorPanel Test Breaking Change (CRITICAL)
**What goes wrong:** `InspectorPanel.test.tsx` currently uses `elementType="image"` prop (Phase 5 signature). Phase 6 changes the prop to `element={...}`. If Wave 0 doesn't update the test file, the test file will fail to compile/render after InspectorPanel.tsx is updated in Wave 3 — causing all 5 InspectorPanel tests to ERROR.
**Why it happens:** The prop rename is a breaking interface change. Old test code passes `elementType` string; new component expects `element` object.
**How to avoid:** In Wave 0, rewrite `InspectorPanel.test.tsx` to use the new prop signature BEFORE Phase 6 implementation. The tests should be RED for behaviour (no editors yet) but GREEN for compilation.
**Warning signs:** TypeScript errors in test file if InspectorPanel prop type is updated before the test.

### Pitfall 2: ColumnSlot Test Checks `[image]` Stub Text
**What goes wrong:** `ColumnSlot.test.tsx` line ~33 asserts `getByText('[image]')` — this passes because the current `ElementRenderer` stub renders `[{element.type}]`. When Phase 6 replaces ElementRenderer with real renderers, `ImageRenderer` renders either an `<img>` or the "Add image URL" placeholder — the `[image]` text disappears.
**Why it happens:** The test was written against the Phase 5 stub and never updated for Phase 6 behaviour.
**How to avoid:** Wave 0 must update this test. The `{ type: 'image' } as any` element has no `src` → ImageRenderer empty-state path → test should check for "Add image URL" text (or the Image lucide icon) instead.
**Warning signs:** `TestingLibraryElementError: Unable to find an element with the text: [image]` after ElementRenderer is updated.

### Pitfall 3: Ghost Button Type in Runtime State
**What goes wrong:** A user (or test data) might have a `ButtonElement` with `style: 'ghost'` stored in the doc. If the `ButtonRenderer` switch throws `assertNeverElement(element)` for ghost, the entire canvas crashes when that element is rendered.
**Why it happens:** Phase 6 designer (correctly) excluded ghost from the editor, but the type system still includes it and any stored data could have it.
**How to avoid:** Use a fall-through from `'ghost'` to `'solid'` case in the ButtonRenderer switch — solid is the safe fallback.
**Warning signs:** Console error "Unhandled element type: ghost" at runtime.

### Pitfall 4: `href` Navigation During Canvas Editing
**What goes wrong:** Both `ImageLinkRenderer` and `ButtonRenderer` use `<a href={element.href}>`. If href is a real URL and element.href is non-empty, clicking the canvas element during editing triggers navigation away from the builder.
**Why it happens:** `<a>` tags navigate by default on click.
**How to avoid:** Use `href={element.href || '#'}` (already specified in UI-SPEC) — when href is empty, `#` prevents navigation. The ColumnSlot already has `e.stopPropagation()` on click, which also helps. For non-empty hrefs, the `e.stopPropagation()` in ColumnSlot's click handler fires first (element selection), but the `<a>` tag's default navigation is separate — consider whether to add `e.preventDefault()` in the `<a>`'s onClick in builder mode.
**Warning signs:** Builder page unexpectedly navigates to configured link URL when clicking a filled button element.

### Pitfall 5: `<img>` Inline Baseline Gap
**What goes wrong:** Inline `<img>` elements have a default `display: inline` which creates a small gap at the bottom (baseline alignment gap) causing the slot to appear taller than expected.
**Why it happens:** CSS baseline alignment for inline elements.
**How to avoid:** Add `className="block"` (Tailwind) AND `style={{ display: 'block', ... }}` (inline style) to the `<img>`. The UI-SPEC explicitly notes this: `className="block min-h-[70px] w-full"` + `style={{ display: 'block' }}`.
**Warning signs:** Visible white space below images; slot height unexpectedly larger than image.

### Pitfall 6: `setElement` Removal Regression
**What goes wrong:** The store has `setElement` marked `@deprecated "remove in Phase 6"`. If removed but something calls it, runtime error.
**Why it happens:** Incomplete search for callers.
**How to avoid:** Verified via codebase search — `setElement` is only defined in `useNewsletterStore.ts` and has no callers in the rest of the codebase. [VERIFIED] Safe to remove. Also remove from the `NewsletterActions` interface.
**Warning signs:** TypeScript error "Property 'setElement' does not exist" if any component was calling it.

### Pitfall 7: `data-builder-only` Attribute Omission
**What goes wrong:** The ExternalLink badge on `ImageLinkRenderer` must carry `data-builder-only="true"`. Phase 9 export pipeline uses this attribute to strip builder-only chrome from the HTML output. Missing it means Phase 9 will include the link badge in export HTML.
**Why it happens:** Easily overlooked visual detail.
**How to avoid:** Include `data-builder-only="true"` as a prop on the badge container span (the one holding the ExternalLink icon). Treat it as a functional requirement, not decoration.
**Warning signs:** Phase 9 exported HTML contains the ExternalLink badge icon in the output.

---

## Code Examples

### ImageRenderer — Complete Implementation
```typescript
// Source: UI-SPEC ImageRenderer section + D-01, D-02, D-10
import React from 'react';
import { Image } from 'lucide-react';
import type { ImageElement } from '../../types/newsletter';

export function ImageRenderer({ element }: { element: ImageElement }) {
  if (!element.src) {
    return (
      <div className="min-h-[70px] flex flex-col items-center justify-center bg-accent rounded gap-1 p-4">
        <Image className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Add image URL</span>
      </div>
    );
  }
  return (
    <img
      src={element.src}
      alt={element.alt}
      className="block min-h-[70px] w-full"
      style={{ width: element.width ?? '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}
```

### ImageLinkRenderer — Complete Implementation
```typescript
// Source: UI-SPEC ImageLinkRenderer section + D-11
import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ImageLinkElement, ImageElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';

export function ImageLinkRenderer({ element }: { element: ImageLinkElement }) {
  // Cast to ImageElement for ImageRenderer (same fields, different type discriminant)
  const imageProps: ImageElement = { type: 'image', id: element.id, src: element.src, alt: element.alt, width: element.width };

  return (
    <a
      href={element.href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block"
      onClick={(e) => e.stopPropagation()}  // prevent deselect from BuilderCanvas click handler
    >
      <ImageRenderer element={imageProps} />
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
```

### ButtonRenderer — Complete Implementation
```typescript
// Source: UI-SPEC ButtonRenderer section + D-05, D-12
import React from 'react';
import type { ButtonElement } from '../../types/newsletter';

export function ButtonRenderer({ element }: { element: ButtonElement }) {
  const commonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    padding: '12px 24px',
    borderRadius: element.borderRadius ?? '4px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  // D-05: ghost falls through to solid (safe default)
  const isSolid = element.style !== 'outline';

  const variantStyle: React.CSSProperties = isSolid
    ? { backgroundColor: element.backgroundColor, color: element.textColor, border: 'none' }
    : { backgroundColor: 'transparent', color: element.backgroundColor, border: `2px solid ${element.backgroundColor}` };

  return (
    <div className="w-full py-2 px-4">
      <a
        href={element.href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...commonStyle, ...variantStyle }}
      >
        {element.label}
      </a>
    </div>
  );
}
```

### updateElement Store Action
```typescript
// Source: UI-SPEC section 9 + STATE.md Immer patterns
// Add to NewsletterActions interface:
updateElement: (slotId: string, patch: Partial<ElementUnion>) => void;

// Implementation in immer store:
updateElement: (slotId, patch) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      for (const slot of row.slots) {
        if (slot.id === slotId && slot.element) {
          Object.assign(slot.element, patch);
          return;
        }
      }
    }
  }),
```

### InspectorPanel ELEMENT_NAMES header lookup (unchanged)
```typescript
// Source: InspectorPanel.tsx Phase 5 + ELEMENT_NAMES from BuilderPalette.tsx
// ELEMENT_NAMES is already exported from BuilderPalette.tsx — import it
import { ELEMENT_NAMES } from './BuilderPalette';
// Usage: {ELEMENT_NAMES[element.type]}
```

### Wave 0 — Updated InspectorPanel Test Stubs
```typescript
// Updated prop signature — element object replaces elementType string
const MOCK_IMAGE: ImageElement = { type: 'image', id: 'e1', src: '', alt: '', width: '100%' };
const MOCK_BUTTON: ButtonElement = { type: 'button', id: 'e2', label: 'Click me', href: '', backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid' };

// Tests use element={...} + onUpdate={vi.fn()} instead of elementType="..."
render(<InspectorPanel element={MOCK_IMAGE} onBack={vi.fn()} onUpdate={vi.fn()} />);
```

---

## State of the Art

| Old Approach | Current Approach | Status |
|--------------|------------------|--------|
| `ElementRenderer` stub renders `[{element.type}]` text | Phase 6: real dispatching switch → typed renderers | Replace in Phase 6 |
| `InspectorPanel` with `elementType` prop + placeholder body | Phase 6: `element: ElementUnion` prop + typed editors | Breaking change — Wave 0 test update required |
| `selectedElementType` selector in BuilderPage (returns type string) | Phase 6: `selectedElement` selector (returns full ElementUnion) | Extend in Phase 6 |
| `setElement(sectionId, slotId, element)` deprecated action | Removed in Phase 6; replaced by `updateElement(slotId, patch)` | Safe to remove — no callers [VERIFIED] |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v3 + jsdom + @testing-library/react v16 |
| Config file | `apps/client/vitest.config.ts` |
| Quick run command | `cd apps/client && npx vitest run` |
| Full suite command | `cd apps/client && npx vitest run --reporter=verbose` |

### Current State: 46 tests passing, 18 todo, 4 files skipped [VERIFIED: ran tests]

### Phase Requirements → Test Map

| Req ID | Behaviour | Test Type | File |
|--------|-----------|-----------|------|
| ELEM-01 | ImageRenderer renders `<img>` with src/alt/width | unit | `builder/__tests__/ImageRenderer.test.tsx` |
| ELEM-01 | ImageRenderer shows placeholder when src empty | unit | `builder/__tests__/ImageRenderer.test.tsx` |
| ELEM-01 | ImageRenderer min-h-[70px] on placeholder + img | unit | `builder/__tests__/ImageRenderer.test.tsx` |
| ELEM-02 | `<img alt={element.alt}>` reflects alt field | unit | `builder/__tests__/ImageRenderer.test.tsx` |
| ELEM-02 | ImageEditor alt field dispatches onUpdate({alt}) | unit | `builder/__tests__/ImageEditor.test.tsx` |
| ELEM-03 | ImageLinkRenderer wraps img in `<a href>` | unit | `builder/__tests__/ImageLinkRenderer.test.tsx` |
| ELEM-03 | ExternalLink badge has data-builder-only="true" | unit | `builder/__tests__/ImageLinkRenderer.test.tsx` |
| ELEM-04 | ButtonRenderer renders label text | unit | `builder/__tests__/ButtonRenderer.test.tsx` |
| ELEM-04 | ButtonRenderer solid: bg style = backgroundColor | unit | `builder/__tests__/ButtonRenderer.test.tsx` |
| ELEM-04 | ButtonEditor label/href dispatch onUpdate | unit | `builder/__tests__/ButtonEditor.test.tsx` |
| ELEM-05 | ButtonRenderer outline: transparent bg + border | unit | `builder/__tests__/ButtonRenderer.test.tsx` |
| ELEM-05 | ButtonEditor style toggle dispatches {style:'solid'} | unit | `builder/__tests__/ButtonEditor.test.tsx` |
| updateElement | Store action merges patch into slot.element | unit | `store/__tests__/useNewsletterStore.test.ts` |
| updateElement | Is no-op for unknown slotId | unit | `store/__tests__/useNewsletterStore.test.ts` |
| updateElement | Is no-op for empty slot | unit | `store/__tests__/useNewsletterStore.test.ts` |

### Sampling Rate
- **Per task commit:** `cd apps/client && npx vitest run`
- **Per wave merge:** `cd apps/client && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green (≥ 46 + new Phase 6 tests) before `/gsd-verify-work`

### Wave 0 Gaps (files to create)
- [ ] `apps/client/src/components/builder/__tests__/ImageRenderer.test.tsx` — covers ELEM-01, ELEM-02
- [ ] `apps/client/src/components/builder/__tests__/ImageLinkRenderer.test.tsx` — covers ELEM-03
- [ ] `apps/client/src/components/builder/__tests__/ButtonRenderer.test.tsx` — covers ELEM-04, ELEM-05
- [ ] `apps/client/src/components/builder/__tests__/ImageEditor.test.tsx` — covers ELEM-02 editor fields
- [ ] `apps/client/src/components/builder/__tests__/ButtonEditor.test.tsx` — covers ELEM-04 editor fields
- **UPDATE:** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — prop signature change (D-08)
- **UPDATE:** `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — `[image]` stub text → ImageRenderer placeholder
- **UPDATE:** `apps/client/src/store/__tests__/useNewsletterStore.test.ts` — add updateElement RED stubs

---

## Plan Wave Structure (Recommendation)

Following established TDD pattern from Phases 3–5, Phase 6 maps to **7 plans** (Wave 0 + 6 implementation plans):

| Plan | Wave | Name | Parallel With | Dependencies |
|------|------|------|---------------|--------------|
| 06-00 | 0 | Test stubs — update InspectorPanel/ColumnSlot tests; RED stubs for updateElement, ImageRenderer, ImageLinkRenderer, ButtonRenderer, ImageEditor, ButtonEditor | — | None |
| 06-01 | 1 | `updateElement` store action + `setElement` removal | 06-02 | 06-00 |
| 06-02 | 1 | `ImageRenderer` + `ImageLinkRenderer` components | 06-01 | 06-00 |
| 06-03 | 2 | `ButtonRenderer` component | 06-04 | 06-01, 06-02 |
| 06-04 | 2 | `ElementRenderer` dispatch switch | 06-03 | 06-02 (renderers must exist) |
| 06-05 | 2 | `ImageEditor` + `ButtonEditor` components | 06-03, 06-04 | 06-01 (store action must exist) |
| 06-06 | 3 | `InspectorPanel` upgrade + `BuilderPage` wiring | — | 06-04, 06-05 |

**Note:** The ROADMAP lists 6 plans (not counting Wave 0). The project convention is to add Wave 0 as plan `XX-00`, making it 7 plans total — consistent with Phase 5 (05-00 through 05-05 = 6 plans numbered from 0).

---

## Environment Availability

Step 2.6: No new external dependencies. All tools available. Tests confirmed running.

| Dependency | Required By | Available | Version |
|------------|------------|-----------|---------|
| Node.js / npm | Vitest test runner | ✓ | (current) |
| Vitest | Test suite | ✓ | ^3.0.0 |
| @testing-library/react | Component tests | ✓ | ^16.3.2 |
| lucide-react | Image, ExternalLink icons | ✓ | installed Phase 1 |
| shadcn/ui Input | Editor fields | ✓ | installed Phase 2 |
| shadcn/ui Button | Style toggle | ✓ | installed Phase 2 |
| Native `<input type="color">` | Colour picker | ✓ | browser built-in |

**No missing dependencies.** Phase 6 is a purely additive UI phase.

---

## Security Domain

This phase has no backend changes, no authentication, no data persistence beyond existing Zustand → auto-save flow. ASVS categories:

| ASVS Category | Applies | Note |
|---------------|---------|------|
| V5 Input Validation | Minimal | Width field accepts free-form string (D-04: no validation by design); hex fields accept raw string (browser `type="color"` validates the colour picker path); no XSS vectors since values go into React props (React escapes HTML attribute values) |
| V2/V3/V4/V6 | No | No auth, no sessions, no crypto in this phase |

**XSS note:** `element.src`, `element.href`, `element.label` values rendered via React JSX (not `dangerouslySetInnerHTML`) — React auto-escapes. No XSS concern for Phase 6. Phase 9 export pipeline (which uses raw HTML output) will need to sanitize, but that's out of scope.

---

## Open Questions (RESOLVED)

1. **`ImageLinkRenderer` — should anchor clicks be prevented in builder?**
   - What we know: ColumnSlot has `e.stopPropagation()` on its onClick which triggers element selection.
   - What's unclear: If `href` is non-empty and user clicks the image-link element, does the `<a>` also navigate? `stopPropagation` doesn't prevent default anchor navigation.
   - Recommendation: Add `onClick={(e) => e.stopPropagation()}` on the `<a>` in `ImageLinkRenderer` so it only registers as a canvas slot click (handled by ColumnSlot), not a navigation. The UI-SPEC confirms the `<a>` uses `target="_blank"` so any navigation would open in a new tab anyway — minor UX issue, not a breakage. Planner should decide whether to add `e.stopPropagation()` on the anchor element.
   - **RESOLVED (Plan 06-02):** `onClick={(e) => e.stopPropagation()}` added to the `<a>` in `ImageLinkRenderer` per plan task 06-02-02.

2. **`setElement` removal — TypeScript interface update**
   - What we know: `setElement` is defined in `NewsletterActions` interface. No callers. Comment says "remove in Phase 6".
   - What's unclear: Should the `@deprecated` JSDoc be removed from the interface too?
   - Recommendation: Yes — remove both the interface entry and implementation. It's dead code with no callers.
   - **RESOLVED (Plan 06-01):** Both `setElement` interface entry and implementation removed in Plan 06-01 task 06-01-01.

3. **`ImageEditor` for `image-link` — `href` field**
   - What we know: `ImageEditor` handles both `image` and `image-link` types. `ImageElement` has no `href`; `ImageLinkElement` has `href`.
   - What's unclear: The UI-SPEC shows `onUpdate: (patch: Partial<ImageElement & ImageLinkElement>)` for `ImageEditor` — should the href field show conditionally for `image-link` only?
   - Recommendation: Yes — show the href field only when `element.type === 'image-link'`. This is implied by the spec (href only exists on ImageLinkElement). The planner should specify this conditional render.
   - **RESOLVED (Plan 06-05):** `href` input rendered conditionally with `{element.type === 'image-link' && ...}` in `ImageEditor`, cast via `as Partial<ImageLinkElement>` in onChange per plan task 06-05-01.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `!element.src` (falsy check) covers both `''` and `undefined` edge cases from fixture tests | Code Examples | Only a test robustness issue; runtime always has `src: ''` from createDefaultElement |
| A2 | `setElement` is safe to delete (no callers in codebase) | Common Pitfalls #6 | Would cause runtime TypeError; but VERIFIED via codebase search |
| A3 | Phase 6 Wave 0 should update ColumnSlot test's `[image]` assertion | Plan Wave Structure | If not updated in Wave 0, ElementRenderer plan (06-04) breaks 1 test |

**A2 is verified, not truly assumed.** A1 and A3 are low-risk assumptions.

---

## Sources

### Primary (HIGH confidence — VERIFIED in this session)
- `apps/client/src/types/newsletter.ts` — ImageElement, ImageLinkElement, ButtonElement types confirmed
- `apps/client/src/store/useNewsletterStore.ts` — all existing actions, Immer patterns, createDefaultElement defaults
- `apps/client/src/components/builder/ElementRenderer.tsx` — current stub content confirmed
- `apps/client/src/components/builder/InspectorPanel.tsx` — current prop signature confirmed
- `apps/client/src/pages/BuilderPage.tsx` — current selectedElementType selector pattern confirmed
- `apps/client/src/components/builder/ColumnSlot.tsx` — current `[image]` text assertion risk confirmed
- `apps/client/src/components/ui/button.tsx` — variant names (`default`, `outline`) and `size="sm"` confirmed
- `apps/client/src/components/ui/input.tsx` — Input component API confirmed
- `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` — old prop signature confirmed
- `apps/client/src/components/builder/__tests__/ColumnSlot.test.tsx` — `[image]` text check confirmed
- `apps/client/vitest.config.ts` — jsdom environment confirmed
- `.planning/phases/06-image-and-button-elements/06-CONTEXT.md` — all D-01 through D-12 decisions
- `.planning/phases/06-image-and-button-elements/06-UI-SPEC.md` — pixel-perfect component specs approved
- `.planning/STATE.md` — CC-2, CC-6, Tailwind v4 rule, font-medium forbidden
- `.planning/config.json` — nyquist_validation: true confirmed
- vitest run output — 46 tests passing baseline confirmed

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` Phase 6 section — 6 plans listed (Wave 0 to be added as project convention)
- `.planning/phases/05-dnd-element-placement/05-00-PLAN.md` — Wave 0 TDD stub pattern confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified installed, versions confirmed from STATE.md
- Architecture patterns: HIGH — all patterns derived directly from verified codebase + approved UI-SPEC
- Pitfalls: HIGH — two pitfalls (InspectorPanel breaking change, ColumnSlot [image] text) confirmed by direct code inspection
- Plan structure: HIGH — wave pattern confirmed from 5 prior phases

**Research date:** 2026-06-08
**Valid until:** Stable — no external dependencies; valid until Phase 6 starts execution
