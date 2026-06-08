# Phase 6: Image & Button Elements — Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 17 (10 new, 7 modified)
**Analogs found:** 17 / 17

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `builder/ImageRenderer.tsx` | component (renderer) | request-response | `builder/ElementRenderer.tsx` + `builder/ColumnSlot.tsx` | role-match |
| `builder/ImageLinkRenderer.tsx` | component (renderer wrapper) | request-response | `builder/RowBlock.tsx` (wraps sub, absolute badge) | role-match |
| `builder/ButtonRenderer.tsx` | component (renderer) | request-response | `builder/RowBlock.tsx` (inline styles CC-2/CC-6 pattern) | role-match |
| `builder/ImageEditor.tsx` | component (editor form) | event-driven | `builder/InspectorPanel.tsx` (prop+callback pattern) | partial-match |
| `builder/ButtonEditor.tsx` | component (editor form) | event-driven | `builder/InspectorPanel.tsx` (prop+callback pattern) | partial-match |
| `builder/__tests__/ImageRenderer.test.tsx` | test | request-response | `builder/__tests__/RowBlock.test.tsx` | role-match |
| `builder/__tests__/ImageLinkRenderer.test.tsx` | test | request-response | `builder/__tests__/RowBlock.test.tsx` | role-match |
| `builder/__tests__/ButtonRenderer.test.tsx` | test | request-response | `builder/__tests__/RowBlock.test.tsx` | role-match |
| `builder/__tests__/ImageEditor.test.tsx` | test | event-driven | `builder/__tests__/InspectorPanel.test.tsx` | role-match |
| `builder/__tests__/ButtonEditor.test.tsx` | test | event-driven | `builder/__tests__/InspectorPanel.test.tsx` | role-match |
| `builder/ElementRenderer.tsx` (modify) | component (dispatch router) | request-response | `store/useNewsletterStore.ts` createDefaultElement switch | exact |
| `builder/InspectorPanel.tsx` (modify) | component (panel + routing) | event-driven | self (carry-forward header; replace body) | exact |
| `pages/BuilderPage.tsx` (modify) | page | CRUD | self (extend existing selector) | exact |
| `store/useNewsletterStore.ts` (modify) | store | CRUD | self — `addElement`/`removeElement` pattern | exact |
| `builder/__tests__/InspectorPanel.test.tsx` (modify) | test | event-driven | self (prop rename update) | exact |
| `builder/__tests__/ColumnSlot.test.tsx` (modify) | test | request-response | self (assertion text update) | exact |
| `store/__tests__/useNewsletterStore.test.ts` (modify) | test | CRUD | self — Phase 5 element mutation stubs | exact |

> All paths are relative to `apps/client/src/components/` or `apps/client/src/` as contextually clear.

---

## Pattern Assignments

### `builder/ImageRenderer.tsx` (component, request-response)

**Primary analog:** `apps/client/src/components/builder/ElementRenderer.tsx`
**Secondary analog:** `apps/client/src/components/builder/ColumnSlot.tsx` (empty-state gate pattern)

**Imports pattern** — copy from `ElementRenderer.tsx` lines 1-3, extended:
```typescript
import React from 'react';
import { Image } from 'lucide-react';
import type { ImageElement } from '../../types/newsletter';
```

**Core pattern — empty-state gate** (from `ColumnSlot.tsx` lines 42-58, adapted for ImageRenderer):
```typescript
// ColumnSlot.tsx lines 42-58: empty-state renders different JSX than occupied state
if (!slot.element) {
  return (
    <div className={cn('min-h-[80px] flex items-center justify-center', ...)}>
      Drop element here
    </div>
  );
}
// Phase 6 ImageRenderer mirrors this: gate on !element.src
```

**Core pattern — image empty-state** (D-01, D-02 from RESEARCH.md Pattern 1):
```typescript
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

**Critical notes:**
- Use `!element.src` (falsy), not strict `=== ''`, to handle undefined edge cases in tests
- `className="block"` + `style={{ display: 'block' }}` both required — prevents inline baseline gap (Pitfall 5)
- `min-h-[70px]` is an EXPLICIT pixel class — the square-bracket syntax is mandatory; no Tailwind shorthand exists

---

### `builder/ImageLinkRenderer.tsx` (component, request-response)

**Primary analog:** `apps/client/src/components/builder/RowBlock.tsx`

**Imports pattern** — from `RowBlock.tsx` lines 1-8, adapted:
```typescript
import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ImageLinkElement, ImageElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';
```

**Core pattern — wrapper with absolute-positioned child badge**
`RowBlock.tsx` lines 112-142 shows the `relative` wrapper + absolute-positioned `SectionControls` pattern. `ImageLinkRenderer` mirrors this for the ExternalLink badge:

```typescript
// RowBlock.tsx lines 112-114: 'relative' enables absolute SectionControls
<div
  ref={setNodeRef}
  className={cn('relative bg-white rounded border shadow-sm', ...)}
>
  <SectionControls ... />  {/* absolute-positioned outside parent bounds */}
</div>
```

**Core pattern — complete ImageLinkRenderer** (RESEARCH.md Pattern Code Examples):
```typescript
export function ImageLinkRenderer({ element }: { element: ImageLinkElement }) {
  const imageProps: ImageElement = {
    type: 'image', id: element.id, src: element.src, alt: element.alt, width: element.width
  };

  return (
    <a
      href={element.href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block"
      onClick={(e) => e.stopPropagation()}
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

**Critical notes:**
- `data-builder-only="true"` on the badge span is a functional requirement — Phase 9 export pipeline strips elements with this attribute (Pitfall 7)
- `href={element.href || '#'}` prevents navigation when href is empty (Pitfall 4)
- `onClick={(e) => e.stopPropagation()}` on `<a>` prevents ColumnSlot deselect from firing twice

---

### `builder/ButtonRenderer.tsx` (component, request-response)

**Primary analog:** `apps/client/src/components/builder/RowBlock.tsx` (inline styles for configurable colours)

**Imports pattern:**
```typescript
import React from 'react';
import type { ButtonElement } from '../../types/newsletter';
```

**Core pattern — inline styles for configurable colours** (from `RowBlock.tsx` lines 117-121):
```typescript
// RowBlock.tsx lines 117-121: inline styles for section-level configurable colours
style={{
  ...style,
  backgroundColor: section.backgroundColor ?? '#ffffff',
  paddingTop:    section.paddingTop    ? `${section.paddingTop}px`    : undefined,
  paddingBottom: section.paddingBottom ? `${section.paddingBottom}px` : undefined,
}}
```

**Core pattern — complete ButtonRenderer with ghost fall-through** (RESEARCH.md Pattern 3, CC-2/CC-6):
```typescript
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

  // D-05: ghost falls through to solid (safe default — ghost is valid stored value, Pitfall 3)
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

**Critical notes:**
- ALL colours (`backgroundColor`, `textColor`, border) MUST be inline styles — NEVER Tailwind colour classes. CC-2/CC-6 email compatibility constraint.
- `ghost` fall-through to solid: use `element.style !== 'outline'` not a switch with `assertNeverElement` (Pitfall 3). Ghost is a valid stored value.
- `href={element.href || '#'}` prevents navigation in builder (Pitfall 4)
- `fontWeight: 600` in inline style — `font-semibold` equivalent. `font-medium` (500) is FORBIDDEN project-wide.

---

### `builder/ImageEditor.tsx` (component, event-driven)

**Primary analog:** `apps/client/src/components/builder/InspectorPanel.tsx` (prop + callback shape)

**Imports pattern** — adapted from `InspectorPanel.tsx` lines 1-14:
```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import type { ImageElement, ImageLinkElement } from '../../types/newsletter';
```

**Props pattern** — mirroring InspectorPanel prop shape (current file lines 18-21):
```typescript
// InspectorPanel.tsx lines 18-21: typed props with callback
interface InspectorPanelProps {
  elementType: ElementUnion['type'];
  onBack:      () => void;
}
// Phase 6 ImageEditor mirrors this shape:
interface ImageEditorProps {
  element: ImageElement | ImageLinkElement;
  onUpdate: (patch: Partial<ImageElement & ImageLinkElement>) => void;
}
```

**Core pattern — controlled field with immediate dispatch** (D-07):
```typescript
// Every field: div.flex.flex-col.gap-1 > label.text-xs.font-semibold > Input
// onChange fires onUpdate immediately — no debounce (D-07)
export function ImageEditor({ element, onUpdate }: ImageEditorProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Source URL</label>
        <Input
          value={element.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Alt Text</label>
        <Input
          value={element.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Image description"
          className="text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Width</label>
        <Input
          value={element.width ?? '100%'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="e.g. 100% or 300px"
          className="text-sm"
        />
      </div>
      {/* href field: conditional — shown only for image-link type */}
      {element.type === 'image-link' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">Link URL</label>
          <Input
            value={element.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="https://..."
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
```

**Critical notes:**
- `element.width ?? '100%'` — controlled value with fallback; raw string stored, no validation (D-03/D-04)
- `element.type === 'image-link'` conditional for `href` field — ImageElement has no href prop
- Import `Input` from `@/components/ui/input` — shadcn path alias pattern (same as InspectorPanel's `@/components/ui/button`)
- No local state — element prop is single source of truth (D-07)

---

### `builder/ButtonEditor.tsx` (component, event-driven)

**Primary analog:** `apps/client/src/components/builder/InspectorPanel.tsx` (prop+callback shape)
**Secondary analog:** `builder/ImageEditor.tsx` (same field-group layout pattern — once created)

**Imports pattern:**
```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ButtonElement } from '../../types/newsletter';
```

**Core pattern — color picker + hex Input sync** (RESEARCH.md Pattern 7):
```typescript
// Both inputs read from element prop (controlled). Both dispatch immediately (D-07).
// No local state needed — element prop is the single source of truth.
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

**Core pattern — segmented style toggle** (D-06):
```typescript
// shadcn Button variant="default" = active; variant="outline" = inactive
// Both buttons flex-1 so equal width. type="button" prevents form submission.
<div className="flex gap-1">
  <Button
    variant={element.style === 'solid' ? 'default' : 'outline'}
    size="sm"
    className="flex-1"
    onClick={() => onUpdate({ style: 'solid' })}
    type="button"
  >
    Filled
  </Button>
  <Button
    variant={element.style === 'outline' ? 'default' : 'outline'}
    size="sm"
    className="flex-1"
    onClick={() => onUpdate({ style: 'outline' })}
    type="button"
  >
    Outline
  </Button>
</div>
```

**Critical notes:**
- `Button` from `@/components/ui/button` — confirmed installed; `variant="default"` (active) vs `variant="outline"` (inactive)
- Section dividers: `<div className="border-t border-border" />` between field groups (my-3 rhythm)
- `font-mono text-xs` on hex Input — monospace for hex legibility
- `maxLength={7}` on hex Input — 7 chars max `#rrggbb`
- No ghost toggle — D-05 explicitly excludes ghost from Phase 6 editor

---

### `builder/__tests__/ImageRenderer.test.tsx` (test, request-response)

**Primary analog:** `apps/client/src/components/builder/__tests__/RowBlock.test.tsx`

**Imports pattern** (from `RowBlock.test.tsx` lines 1-6):
```typescript
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageRenderer } from '../ImageRenderer';
import type { ImageElement } from '../../../types/newsletter';
```

**Test structure pattern** (from `RowBlock.test.tsx` lines 8-15):
```typescript
// Factory function for test fixtures — matches RowBlock.test.tsx makeSection() pattern
function makeImageElement(overrides: Partial<ImageElement> = {}): ImageElement {
  return { type: 'image', id: 'e1', src: '', alt: '', width: '100%', ...overrides };
}
```

**Core test pattern — rendering assertions** (from `RowBlock.test.tsx` lines 18-64):
```typescript
describe('ImageRenderer — empty state (src === "")', () => {
  it('ELEM-01: renders placeholder when src is empty', () => {
    render(<ImageRenderer element={makeImageElement()} />);
    expect(screen.getByText('Add image URL')).toBeInTheDocument();
  });
});

describe('ImageRenderer — rendered state (src !== "")', () => {
  it('ELEM-01: renders <img> with src attribute', () => {
    render(<ImageRenderer element={makeImageElement({ src: 'https://example.com/img.jpg' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('ELEM-02: <img> has correct alt text', () => {
    render(<ImageRenderer element={makeImageElement({ src: 'https://x.com/i.jpg', alt: 'My image' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'My image');
  });
});
```

**Critical notes:**
- No DndContext wrapper needed — ImageRenderer has no DnD dependency (unlike BuilderPalette/ColumnSlot tests)
- `container.querySelector('img')` or `screen.getByRole('img')` for the rendered image element
- Use `toHaveStyle` for inline style assertions (same pattern as `RowBlock.test.tsx` line 27)

---

### `builder/__tests__/ImageLinkRenderer.test.tsx` (test, request-response)

**Primary analog:** `apps/client/src/components/builder/__tests__/RowBlock.test.tsx`

**Imports pattern:**
```typescript
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageLinkRenderer } from '../ImageLinkRenderer';
import type { ImageLinkElement } from '../../../types/newsletter';
```

**Core test pattern** (testing the anchor wrapper + badge):
```typescript
function makeImageLinkElement(overrides: Partial<ImageLinkElement> = {}): ImageLinkElement {
  return { type: 'image-link', id: 'e1', src: 'https://x.com/img.jpg', alt: 'test', href: 'https://x.com', width: '100%', ...overrides };
}

it('ELEM-03: wraps ImageRenderer in an <a> tag with href', () => {
  const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
  const anchor = container.querySelector('a');
  expect(anchor).not.toBeNull();
  expect(anchor).toHaveAttribute('href', 'https://x.com');
});

it('ELEM-03: ExternalLink badge has data-builder-only="true"', () => {
  const { container } = render(<ImageLinkRenderer element={makeImageLinkElement()} />);
  const badge = container.querySelector('[data-builder-only="true"]');
  expect(badge).not.toBeNull();
});
```

---

### `builder/__tests__/ButtonRenderer.test.tsx` (test, request-response)

**Primary analog:** `apps/client/src/components/builder/__tests__/RowBlock.test.tsx`

**Imports pattern:**
```typescript
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ButtonRenderer } from '../ButtonRenderer';
import type { ButtonElement } from '../../../types/newsletter';
```

**Core test pattern — inline style assertions** (mirroring `RowBlock.test.tsx` line 26-32 `toHaveStyle`):
```typescript
function makeButtonElement(overrides: Partial<ButtonElement> = {}): ButtonElement {
  return {
    type: 'button', id: 'e1', label: 'Click me', href: '',
    backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid',
    ...overrides
  };
}

it('ELEM-04: renders button label text', () => {
  render(<ButtonRenderer element={makeButtonElement()} />);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

it('ELEM-04: solid variant has backgroundColor inline style', () => {
  const { container } = render(<ButtonRenderer element={makeButtonElement()} />);
  const anchor = container.querySelector('a');
  expect(anchor).toHaveStyle({ backgroundColor: '#0066cc' });
});

it('ELEM-05: outline variant has transparent background and border', () => {
  const { container } = render(
    <ButtonRenderer element={makeButtonElement({ style: 'outline' })} />
  );
  const anchor = container.querySelector('a');
  expect(anchor).toHaveStyle({ backgroundColor: 'transparent' });
  expect(anchor).toHaveStyle({ border: '2px solid #0066cc' });
});
```

---

### `builder/__tests__/ImageEditor.test.tsx` (test, event-driven)

**Primary analog:** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx`

**Imports pattern** (from `InspectorPanel.test.tsx` lines 1-7):
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageEditor } from '../ImageEditor';
import type { ImageElement, ImageLinkElement } from '../../../types/newsletter';
```

**Core test pattern — vi.fn() callback + fireEvent** (from `InspectorPanel.test.tsx` lines 33-40):
```typescript
// InspectorPanel.test.tsx lines 33-40: vi.fn() callback pattern
it('D-04: clicking back arrow calls onBack callback', () => {
  const onBack = vi.fn();
  render(<InspectorPanel elementType="image-link" onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back to palette' }));
  expect(onBack).toHaveBeenCalledOnce();
});

// Phase 6 ImageEditor mirrors:
it('ELEM-02: alt field dispatches onUpdate with { alt: value }', () => {
  const onUpdate = vi.fn();
  render(<ImageEditor element={{ type: 'image', id: 'e1', src: '', alt: '', width: '100%' }} onUpdate={onUpdate} />);
  const altInput = screen.getByPlaceholderText('Image description');
  fireEvent.change(altInput, { target: { value: 'My alt text' } });
  expect(onUpdate).toHaveBeenCalledWith({ alt: 'My alt text' });
});
```

**Critical notes:**
- `vi.fn()` for `onUpdate` — same pattern as `onBack` in InspectorPanel tests
- `fireEvent.change` for Input fields — mirrors InspectorPanel's `fireEvent.click`
- Use `screen.getByPlaceholderText()` to locate inputs (since labels are non-semantic `<label>` elements, not htmlFor-linked)

---

### `builder/__tests__/ButtonEditor.test.tsx` (test, event-driven)

**Primary analog:** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx`

**Core test pattern — segmented toggle + color picker:**
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonEditor } from '../ButtonEditor';
import type { ButtonElement } from '../../../types/newsletter';

const MOCK_BUTTON: ButtonElement = {
  type: 'button', id: 'e1', label: 'Click me', href: '',
  backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid',
};

it('ELEM-05: style toggle "Filled" dispatches { style: "solid" }', () => {
  const onUpdate = vi.fn();
  render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Filled' }));
  expect(onUpdate).toHaveBeenCalledWith({ style: 'solid' });
});

it('ELEM-05: style toggle "Outline" dispatches { style: "outline" }', () => {
  const onUpdate = vi.fn();
  render(<ButtonEditor element={MOCK_BUTTON} onUpdate={onUpdate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Outline' }));
  expect(onUpdate).toHaveBeenCalledWith({ style: 'outline' });
});
```

---

### `builder/ElementRenderer.tsx` (modify — stub → dispatch switch)

**Primary analog:** `apps/client/src/store/useNewsletterStore.ts` — `createDefaultElement` switch (lines 28-43)

**Imports pattern** — extending current `ElementRenderer.tsx` lines 1-3:
```typescript
import React from 'react';
import type { ElementUnion } from '../../types/newsletter';
import { assertNeverElement } from '../../types/newsletter';
import { ImageRenderer } from './ImageRenderer';
import { ImageLinkRenderer } from './ImageLinkRenderer';
import { ButtonRenderer } from './ButtonRenderer';
```

**Core pattern — exhaustive switch on element.type** (from `useNewsletterStore.ts` lines 28-43):
```typescript
// useNewsletterStore.ts lines 28-43: switch on discriminated union type
switch (type) {
  case 'image':
    return { type: 'image', id, src: '', alt: '', width: '100%' };
  // ... other cases
  default:
    return assertNeverElement(type);
}

// Phase 6 ElementRenderer mirrors exactly:
switch (element.type) {
  case 'image':      return <ImageRenderer element={element} />;
  case 'image-link': return <ImageLinkRenderer element={element} />;
  case 'button':     return <ButtonRenderer element={element} />;
  case 'rich-text':
    return (
      <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
        [rich-text]
      </div>
    );
  case 'divider':
    return (
      <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
        [divider]
      </div>
    );
  default:
    return assertNeverElement(element);
}
```

**Critical notes:**
- Stub passthrough for `rich-text` and `divider` reuses the same `bg-accent rounded` visual style as the Phase 5 universal stub — just with fixed type strings instead of `[{element.type}]`
- `assertNeverElement(element)` — NOT `assertNeverElement(element.type)`. The function accepts `never` and the whole element object narrows to `never` in the default case.

---

### `builder/InspectorPanel.tsx` (modify — prop change + routing)

**Primary analog:** self — current `apps/client/src/components/builder/InspectorPanel.tsx`

**Header section to KEEP UNCHANGED** (lines 25-39):
```typescript
// Keep exactly — only the prop destructuring and body change
<div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Back to palette"
    onClick={onBack}
  >
    <ArrowLeft className="size-4" />
  </Button>
  <span className="text-sm font-semibold text-foreground">
    {ELEMENT_NAMES[element.type]}   {/* Change: elementType → element.type */}
  </span>
</div>
```

**New imports to add** (above existing imports):
```typescript
import { ImageEditor } from './ImageEditor';
import { ButtonEditor } from './ButtonEditor';
import { assertNeverElement } from '../../types/newsletter';
```

**Updated interface** (replace lines 18-21):
```typescript
// Old (Phase 5):
interface InspectorPanelProps {
  elementType: ElementUnion['type'];
  onBack:      () => void;
}

// New (Phase 6):
interface InspectorPanelProps {
  element:   ElementUnion;
  onBack:    () => void;
  onUpdate:  (patch: Partial<ElementUnion>) => void;
}
```

**Body routing** (replaces `<div className="p-4">` placeholder):
```typescript
// replaces lines 42-46 ("Body — placeholder note")
switch (element.type) {
  case 'image':
  case 'image-link':
    return <ImageEditor element={element} onUpdate={onUpdate} />;
  case 'button':
    return <ButtonEditor element={element} onUpdate={onUpdate} />;
  case 'rich-text':
  case 'divider':
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Editor available in Phase 7.</p>
      </div>
    );
  default:
    return assertNeverElement(element);
}
```

---

### `pages/BuilderPage.tsx` (modify — selector extension + wiring)

**Primary analog:** self — current `apps/client/src/pages/BuilderPage.tsx`

**Existing selector to replace** (lines 23-33 — `selectedElementType`):
```typescript
// EXISTING (lines 23-33) — replace with selectedElement returning full object:
const selectedElementType = useNewsletterStore((state) => {
  if (!state.selectedElementId || !state.doc) return null;
  for (const row of state.doc.rows) {
    for (const slot of row.slots) {
      if (slot.id === state.selectedElementId && slot.element) {
        return slot.element.type;  // ← change this to return slot.element
      }
    }
  }
  return null;
});
```

**New selector** (RESEARCH.md Pattern 6):
```typescript
// Replace selectedElementType selector with selectedElement:
const selectedElement = useNewsletterStore((state) => {
  if (!state.selectedElementId || !state.doc) return null;
  for (const row of state.doc.rows) {
    for (const slot of row.slots) {
      if (slot.id === state.selectedElementId && slot.element) {
        return slot.element;  // full ElementUnion object
      }
    }
  }
  return null;
});
const updateElement = useNewsletterStore((s) => s.updateElement);
```

**Updated JSX conditional** (lines 69-77 — InspectorPanel usage):
```typescript
// Old (lines 69-77):
{selectedElementId && selectedElementType
  ? (
    <InspectorPanel
      elementType={selectedElementType}
      onBack={() => setSelectedElement(null)}
    />
  )
  : <BuilderPalette />
}

// New:
{selectedElementId && selectedElement
  ? (
    <InspectorPanel
      element={selectedElement}
      onBack={() => setSelectedElement(null)}
      onUpdate={(patch) => updateElement(selectedElementId, patch)}
    />
  )
  : <BuilderPalette />
}
```

---

### `store/useNewsletterStore.ts` (modify — add updateElement, remove setElement)

**Primary analog:** self — `addElement`/`removeElement` patterns (lines 149-174)

**New interface entry** (add after `removeElement` in `NewsletterActions`, line 71):
```typescript
// Add to NewsletterActions interface (after removeElement line 71):
updateElement: (slotId: string, patch: Partial<ElementUnion>) => void;
```

**New action implementation** (RESEARCH.md Pattern 2 — copy the Immer `Object.assign` pattern from `addElement`):
```typescript
// addElement pattern (lines 149-161) — same nested loop structure:
addElement: (slotId, elementType) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      const slot = row.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.element = createDefaultElement(elementType);
        return;  // early exit
      }
    }
  }),

// updateElement mirrors exactly, replacing direct assignment with Object.assign:
updateElement: (slotId, patch) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      for (const slot of row.slots) {
        if (slot.id === slotId && slot.element) {
          Object.assign(slot.element, patch);  // Immer in-place mutation
          return;  // early exit
        }
      }
    }
  }),
```

**Remove `setElement`** (lines 72-74 interface + lines 180-186 implementation + its JSDoc lines 177-179):
```typescript
// DELETE these lines — setElement has no callers [VERIFIED]:
// Interface (line 73): setElement: (sectionId: string, slotId: string, element: ElementUnion | null) => void;
// Implementation (lines 176-186): the setElement action and its @deprecated JSDoc block
// Comment on line 71: "// Element mutations (legacy — used by Phase 3 canvas)" — update/remove
```

**Critical notes:**
- `Object.assign(slot.element, patch)` NOT `slot.element = { ...slot.element, ...patch }` — Immer proxies must be mutated in-place
- Guard `slot.element` non-null before `Object.assign` — cannot assign to null slot
- Both the interface entry AND the implementation must be removed for `setElement`

---

### `builder/__tests__/InspectorPanel.test.tsx` (modify — prop signature update)

**Primary analog:** self — current `InspectorPanel.test.tsx` (all 5 tests update from `elementType` string to `element` object)

**Existing props to replace** (all occurrences of `elementType="..."`):
```typescript
// BEFORE (current test lines 11, 16, 22, 28, 36):
render(<InspectorPanel elementType="image" onBack={() => {}} />);
render(<InspectorPanel elementType="rich-text" onBack={() => {}} />);
render(<InspectorPanel elementType="button" onBack={() => {}} />);
render(<InspectorPanel elementType="divider" onBack={() => {}} />);
render(<InspectorPanel elementType="image-link" onBack={onBack} />);

// AFTER — add mock constants at top of file:
const MOCK_IMAGE: ImageElement    = { type: 'image', id: 'e1', src: '', alt: '', width: '100%' };
const MOCK_RICHTEXT: RichTextElement = { type: 'rich-text', id: 'e2', content: { type: 'doc', content: [] }, textStyle: 'body' };
const MOCK_BUTTON: ButtonElement  = { type: 'button', id: 'e3', label: 'Click me', href: '', backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid' };
const MOCK_DIVIDER: DividerElement = { type: 'divider', id: 'e4', color: '#ccc', spacing: 16, thickness: 1 };
const MOCK_IMGLINK: ImageLinkElement = { type: 'image-link', id: 'e5', src: '', alt: '', href: '', width: '100%' };

render(<InspectorPanel element={MOCK_IMAGE} onBack={() => {}} onUpdate={vi.fn()} />);
```

**Test name update** (line 8):
```typescript
// Change test suite name from 'Phase 5 placeholder' to reflect Phase 6:
describe('InspectorPanel (Phase 6)', () => {
```

**Behavior assertion updates:**
- Test asserting "Editing available in the next step." → update to test actual editors render (or keep as a RED stub for editors)
- RESEARCH.md Wave 0 recommendation: tests should be RED for behavior (no editors yet) but GREEN for compilation

---

### `builder/__tests__/ColumnSlot.test.tsx` (modify — [image] text update)

**Primary analog:** self — current `ColumnSlot.test.tsx` line 36

**Single change — update the `[image]` text assertion** (line 36):
```typescript
// BEFORE (line 36):
getByText('[image]');

// AFTER — ImageRenderer with no src renders empty-state placeholder:
// Element has no src field (type: 'image' as any) → ImageRenderer empty-state path
getByText('Add image URL');
```

**Why:** When `ElementRenderer` is replaced in Phase 6, passing `{ type: 'image' } as any` (no `src`) triggers `ImageRenderer`'s empty-state path which renders "Add image URL" instead of `[image]`.

---

### `store/__tests__/useNewsletterStore.test.ts` (modify — add updateElement stubs)

**Primary analog:** self — Phase 5 element mutation stubs (lines 74-118)

**New describe block to add** (after line 118, same pattern as Phase 5 RED stubs):
```typescript
// From Phase 5 RED stubs pattern (lines 74-77):
describe('useNewsletterStore — element mutations (Phase 5 RED stubs)', () => {
  it('ELEM-10: addElement creates element with given type in the matching slot', () => {
    // RED: addElement does not exist yet — TypeError: addElement is not a function
    const { addElement } = useNewsletterStore.getState() as any;
    ...
  });
});

// Phase 6 mirrors this structure:
describe('useNewsletterStore — updateElement (Phase 6)', () => {
  it('ELEM-update: updateElement merges patch into slot.element', () => {
    const { addElement, updateElement } = useNewsletterStore.getState() as any;
    addElement('fixture-slot-1col-1', 'button');
    updateElement('fixture-slot-1col-1', { label: 'Buy Now' });
    const slot = useNewsletterStore.getState().doc!.rows[0].slots[0];
    expect(slot.element?.type).toBe('button');
    expect((slot.element as any).label).toBe('Buy Now');
  });

  it('ELEM-update: updateElement is a no-op for unknown slotId', () => {
    const { updateElement } = useNewsletterStore.getState() as any;
    expect(() => updateElement('unknown-id', { label: 'x' })).not.toThrow();
  });

  it('ELEM-update: updateElement is a no-op for empty slot', () => {
    const { updateElement } = useNewsletterStore.getState() as any;
    expect(() => updateElement('fixture-slot-1col-1', { label: 'x' })).not.toThrow();
    const slot = useNewsletterStore.getState().doc!.rows[0].slots[0];
    expect(slot.element).toBeNull();
  });
});
```

---

## Shared Patterns

### Tailwind v4 Static Class Rule
**Source:** `apps/client/src/components/builder/BuilderPalette.tsx` line 16-17 comment + all builder files
**Apply to:** ALL new files
```typescript
// ⚠️ TAILWIND V4 RULE: All class names MUST be complete string literals.
// NEVER build via template literals — JIT scanner won't find them.
// CORRECT: 'min-h-[70px]'   WRONG: `min-h-[${height}px]`
```

### font-semibold Only (font-medium FORBIDDEN)
**Source:** `apps/client/src/components/builder/ColumnSlot.tsx` line 87 + `InspectorPanel.tsx` line 36
**Apply to:** ALL labels, header text, confirmation text
```typescript
// ColumnSlot.tsx line 87 — explicit font-semibold in confirm text:
className="text-xs font-semibold text-destructive hover:underline cursor-pointer whitespace-nowrap"
// InspectorPanel.tsx line 36 — header:
className="text-sm font-semibold text-foreground"
// FORBIDDEN everywhere: font-medium
```

### Inline Styles for Configurable Colours (CC-2/CC-6)
**Source:** `apps/client/src/components/builder/RowBlock.tsx` lines 117-121
**Apply to:** `ButtonRenderer.tsx`, any future renderer with user-configured visual properties
```typescript
// RowBlock.tsx lines 117-121 — inline style for section-level colours:
style={{
  ...style,
  backgroundColor: section.backgroundColor ?? '#ffffff',
  paddingTop: section.paddingTop ? `${section.paddingTop}px` : undefined,
}}
// NEVER: className="bg-[#0066cc]" for user-configured values
```

### Immer Nested Mutation (Object.assign)
**Source:** `apps/client/src/store/useNewsletterStore.ts` lines 149-161 (`addElement`)
**Apply to:** `updateElement` action in `useNewsletterStore.ts`
```typescript
// addElement lines 149-161: in-place slot mutation with early return
addElement: (slotId, elementType) =>
  set((state) => {
    if (!state.doc) return;
    for (const row of state.doc.rows) {
      const slot = row.slots.find((s) => s.id === slotId);
      if (slot) {
        slot.element = createDefaultElement(elementType);
        return;  // early exit
      }
    }
  }),
// updateElement uses same loop + Object.assign instead of direct assignment
```

### shadcn Path Alias (@/components/ui/...)
**Source:** `apps/client/src/components/builder/InspectorPanel.tsx` line 12, `BuilderPalette.tsx` line 11
**Apply to:** All editor components importing shadcn components
```typescript
// InspectorPanel.tsx line 12:
import { Button } from '@/components/ui/button';
// BuilderPalette.tsx line 11:
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Phase 6 editors use the same alias:
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
```

### assertNeverElement Exhaustiveness
**Source:** `apps/client/src/store/useNewsletterStore.ts` line 41 + `types/newsletter.ts` lines 158-160
**Apply to:** `ElementRenderer.tsx` switch default case, `InspectorPanel.tsx` body routing default case
```typescript
// useNewsletterStore.ts line 41:
default:
  return assertNeverElement(type);

// newsletter.ts lines 158-160:
export function assertNeverElement(x: never): never {
  throw new Error(`Unhandled element type: ${String(x)}`);
}
// NEVER use assertNeverElement for ghost button style — ghost is a valid stored value
```

### Test vi.fn() + fireEvent Pattern
**Source:** `apps/client/src/components/builder/__tests__/InspectorPanel.test.tsx` lines 33-40
**Apply to:** `ImageEditor.test.tsx`, `ButtonEditor.test.tsx`
```typescript
// InspectorPanel.test.tsx lines 33-40:
it('D-04: clicking back arrow calls onBack callback', () => {
  const onBack = vi.fn();
  render(<InspectorPanel elementType="image-link" onBack={onBack} />);
  const btn = screen.getByRole('button', { name: 'Back to palette' });
  fireEvent.click(btn);
  expect(onBack).toHaveBeenCalledOnce();
});
// Phase 6 editor tests use vi.fn() for onUpdate + fireEvent.change for Input fields
```

### Fixture + beforeEach Reset Pattern
**Source:** `apps/client/src/store/__tests__/useNewsletterStore.test.ts` lines 6-11
**Apply to:** `useNewsletterStore.test.ts` new updateElement tests, any test that touches store state
```typescript
// useNewsletterStore.test.ts lines 6-11:
beforeEach(() => {
  useNewsletterStore.setState({
    doc: structuredClone(FIXTURE_DOC),
    selectedElementId: null,
  });
});
```

---

## No Analog Found

No files in Phase 6 are entirely without analog. All patterns have direct precedent in the existing codebase.

| File | Closest Available | Note |
|------|-------------------|------|
| `ImageEditor.tsx` (form body) | `InspectorPanel.tsx` (partial) | No controlled-form editor exists yet; UI-SPEC provides complete field layout — use spec directly |
| `ButtonEditor.tsx` (color picker) | None in codebase | Native `<input type="color">` — browser built-in, no codebase analog needed |

---

## Metadata

**Analog search scope:** `apps/client/src/` — all `components/builder/`, `store/`, `pages/`, `types/`
**Files read:** 14 source files + 3 planning documents (CONTEXT.md, RESEARCH.md, UI-SPEC.md)
**Pattern extraction date:** 2026-06-08
**Key constraint files:** `types/newsletter.ts` (type definitions), `store/useNewsletterStore.ts` (Immer patterns), `InspectorPanel.tsx` (prop shape), `ColumnSlot.tsx` (empty-state gate + inline styles)
