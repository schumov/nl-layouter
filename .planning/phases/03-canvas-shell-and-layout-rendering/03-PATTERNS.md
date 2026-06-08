# Phase 3: Canvas Shell & Layout Rendering — Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 12 (10 new + 2 modified)
**Analogs found:** 11 / 12 (1 file has no close analog — `newsletter.fixture.ts`)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/client/src/components/ui/tabs.tsx` | component (shadcn primitive) | event-driven | `apps/client/src/components/ui/button.tsx` | exact (same CLI-gen pattern) |
| `apps/client/src/components/builder/BuilderCanvas.tsx` | component | request-response | `apps/client/src/components/builder/BuilderHeader.tsx` | role-match |
| `apps/client/src/components/builder/BuilderPalette.tsx` | component | event-driven | `apps/client/src/components/builder/BuilderHeader.tsx` | role-match |
| `apps/client/src/components/builder/RowBlock.tsx` | component | request-response | `apps/client/src/components/dashboard/NewsletterCard.tsx` | role-match |
| `apps/client/src/components/builder/ColumnGrid.tsx` | component + transform | transform | `apps/client/src/components/builder/BuilderHeader.tsx` | partial-match |
| `apps/client/src/components/builder/ColumnSlot.tsx` | component | request-response | `apps/client/src/components/dashboard/NewsletterCard.tsx` | role-match |
| `apps/client/src/components/builder/ElementRenderer.tsx` | component (stub) | request-response | `apps/client/src/components/builder/BuilderHeader.tsx` | role-match |
| `apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx` | test | transform | `apps/client/src/types/__tests__/newsletter.test-d.ts` | partial-match |
| `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` | test | request-response | `apps/client/src/hooks/__tests__/useNewsletters.test.ts` | partial-match |
| `apps/client/src/fixtures/newsletter.fixture.ts` | fixture (static data) | N/A | _(none)_ | no-analog |
| `apps/client/src/pages/BuilderPage.tsx` *(modify)* | page component | request-response | self (existing file) | exact (targeted modification) |
| `apps/client/src/index.css` *(modify)* | config (CSS theme) | N/A | self (existing `@theme inline` block) | exact (targeted addition) |

---

## Pattern Assignments

### `apps/client/src/components/ui/tabs.tsx` (component, event-driven)

**Analog:** `apps/client/src/components/ui/button.tsx`
**Action:** CLI-generated — run `npx shadcn@latest add tabs` from `apps/client`. Do NOT hand-roll.

**Imports pattern** (`button.tsx` lines 1–5):
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
```

**shadcn component structure pattern** (`button.tsx` lines 41–63 — function shape):
```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
export { Button, buttonVariants }
```

**Key patterns to copy:**
- `data-slot="..."` attribute on root element (shadcn convention for styling hooks)
- `cn()` from `@/lib/utils` for className merging
- Named function exports (not default exports) — `export { Tabs, TabsList, TabsTrigger, TabsContent }`
- `React.ComponentProps<"div">` for prop spread pattern
- `import * as React from "react"` (not `import React`)

**Usage import pattern** (from `RESEARCH.md` Pattern 3 — how consumers import tabs):
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

> **CLI install command** (from `apps/client` directory):
> ```bash
> npx shadcn@latest add tabs
> ```
> `@radix-ui/react-tabs@1.1.14` is already in the pnpm virtual store — no new download.

---

### `apps/client/src/components/builder/BuilderCanvas.tsx` (component, request-response)

**Analog:** `apps/client/src/components/builder/BuilderHeader.tsx`

**Imports pattern** (`BuilderHeader.tsx` lines 1–8):
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRenameNewsletter } from '../../hooks/useRenameNewsletter';
import type { SaveStatus } from '../../hooks/useAutoSave';
```

**For BuilderCanvas, adapt to:**
```typescript
import React from 'react';
import type { NewsletterDoc } from '../../types/newsletter';
import { RowBlock } from './RowBlock';
```

**Props interface pattern** (`BuilderHeader.tsx` lines 10–14):
```typescript
interface BuilderHeaderProps {
  id:         string;
  title:      string;
  saveStatus: SaveStatus;
}
```

**For BuilderCanvas, adapt to:**
```typescript
interface BuilderCanvasProps {
  doc: NewsletterDoc | null;
}
```

**Component signature pattern** (`BuilderHeader.tsx` line 16 — note: BuilderHeader uses default export; new builder sub-components use **named export**):
```typescript
// BuilderHeader (page-level import, default export):
export default function BuilderHeader({ id, title, saveStatus }: BuilderHeaderProps)

// New builder sub-components (named export — matches NewsletterCard.tsx pattern):
export function BuilderCanvas({ doc }: BuilderCanvasProps)
```

**Core layout pattern** (`BuilderHeader.tsx` lines 46–48):
```typescript
return (
  <header className="sticky top-0 z-10 h-14 bg-background border-b">
    <div className="flex items-center justify-between gap-4 px-4 h-full">
```

**For BuilderCanvas, the layout from RESEARCH.md Pattern 2:**
```typescript
return (
  <div className="flex-[3] min-w-0 overflow-y-auto bg-canvas">
    <div className="max-w-[640px] mx-auto px-4 py-8 space-y-2">
      {doc?.rows.map((section) => (
        <RowBlock key={section.id} section={section} />
      ))}
      {(!doc || doc.rows.length === 0) && (
        <p className="text-center text-sm text-muted-foreground py-16">
          No sections yet. Drag a layout from the palette to begin.
        </p>
      )}
    </div>
  </div>
);
```

**Critical Tailwind class notes:**
- `flex-[3]` — arbitrary flex value (Tailwind v4 bracket syntax; produces `flex: 3`)
- `min-w-0` — mandatory on every flex child to prevent overflow
- `bg-canvas` — requires `--color-canvas: #f4f4f5` in `index.css @theme inline` block

---

### `apps/client/src/components/builder/BuilderPalette.tsx` (component, event-driven)

**Analog:** `apps/client/src/components/builder/BuilderHeader.tsx`

**Imports pattern:**
```typescript
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

**Component signature pattern** (named export, same as all non-page builder components):
```typescript
export function BuilderPalette()
```

**Core pattern from RESEARCH.md Pattern 3:**
```typescript
const LAYOUT_NAMES: Record<string, string> = {
  '1col':                 '1 Column',
  '2col':                 '2 Columns',
  '3col':                 '3 Columns',
  'small-left-big-right': 'Small-Left / Big-Right',
  'big-left-small-right': 'Big-Left / Small-Right',
};

export function BuilderPalette() {
  return (
    <div className="flex-[2] min-w-0 border-l bg-background overflow-y-auto">
      <Tabs defaultValue="layouts" className="h-full flex flex-col">
        <TabsList className="w-full shrink-0 rounded-none border-b">
          <TabsTrigger value="layouts" className="flex-1">Layouts</TabsTrigger>
          <TabsTrigger value="elements" className="flex-1">Elements</TabsTrigger>
        </TabsList>
        <TabsContent value="layouts" className="p-4 space-y-2">
          {Object.entries(LAYOUT_NAMES).map(([type, label]) => (
            <div key={type} className="p-3 border rounded-md text-sm cursor-default">
              {label}
            </div>
          ))}
        </TabsContent>
        <TabsContent value="elements" className="p-4">
          <p className="text-sm text-muted-foreground">
            Elements will be available in a future phase.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Key pattern notes:**
- `rounded-none` on `TabsList` — overrides shadcn default radius to sit flush
- `border-b` on `TabsList` — separator between tab bar and content
- `shrink-0` on `TabsList` — prevents tab bar from shrinking with tall content
- `flex-[2]` — arbitrary flex value (40% of the 3:2 split with BuilderCanvas)
- Layout card labels from UI-SPEC: `1 Column`, `2 Columns`, `3 Columns`, `Small-Left / Big-Right`, `Big-Left / Small-Right`

---

### `apps/client/src/components/builder/RowBlock.tsx` (component, request-response)

**Analog:** `apps/client/src/components/dashboard/NewsletterCard.tsx`

**Imports pattern** (`NewsletterCard.tsx` lines 1–5 — adapt for RowBlock):
```typescript
// NewsletterCard pattern:
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
// ...
import type { NewsletterSummary } from '../../hooks/useNewsletters';

// RowBlock adaptation:
import React from 'react';
import type { Section } from '../../types/newsletter';
import { ColumnGrid } from './ColumnGrid';
```

**Props interface pattern** (`NewsletterCard.tsx` lines 36–38):
```typescript
interface Props {
  newsletter: NewsletterSummary;
}
// → for RowBlock:
interface RowBlockProps {
  section: Section;
}
```

**Named export pattern** (`NewsletterCard.tsx` line 40):
```typescript
export function NewsletterCard({ newsletter }: Props) {
// → for RowBlock:
export function RowBlock({ section }: RowBlockProps) {
```

**Card wrapper + inline style pattern** (from RESEARCH.md Pattern 4):
```typescript
export function RowBlock({ section }: RowBlockProps) {
  return (
    <div
      className="bg-white rounded border shadow-sm overflow-hidden"
      style={{
        backgroundColor: section.backgroundColor ?? '#ffffff',
        paddingTop:    section.paddingTop    ? `${section.paddingTop}px`    : undefined,
        paddingBottom: section.paddingBottom ? `${section.paddingBottom}px` : undefined,
      }}
    >
      <ColumnGrid section={section} />
    </div>
  );
}
```

**Key pattern notes:**
- `bg-white` explicit — overrides parent `bg-canvas`
- `rounded border shadow-sm overflow-hidden` — card chrome from UI-SPEC
- Inline `style` for `backgroundColor`/padding — supports future per-section styling config
- `?? '#ffffff'` fallback — `backgroundColor` is optional on `Section`

---

### `apps/client/src/components/builder/ColumnGrid.tsx` (component + transform)

**Analog:** `apps/client/src/components/builder/BuilderHeader.tsx` (component structure)
**Data pattern:** `apps/client/src/components/ui/button.tsx` (static record/variant mapping — CVA `cva()` is the closest analog for static variant-to-class mapping)

**Imports pattern:**
```typescript
import React from 'react';
import type { LayoutType, Section } from '../../types/newsletter';
import { ColumnSlot } from './ColumnSlot';
```

**Static record pattern** (analogous to `buttonVariants` in `button.tsx` lines 7–39 — static map from variant to class string):
```typescript
// button.tsx uses cva() for variant→class mapping:
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground ...",
      outline: "border bg-background ...",
    }
  }
})

// ColumnGrid uses a plain Record (no cva needed — just string arrays):
// ⚠️ TAILWIND V4 RULE: All class names MUST be complete string literals.
// NEVER construct via template literals (e.g. `basis-${fraction}`) — JIT won't scan them.
const COLUMN_CLASSES: Record<LayoutType, readonly string[]> = {
  '1col':                 ['basis-full'],
  '2col':                 ['basis-1/2',  'basis-1/2'],
  '3col':                 ['basis-1/3',  'basis-1/3',  'basis-1/3'],
  'small-left-big-right': ['basis-1/3',  'basis-2/3'],
  'big-left-small-right': ['basis-2/3',  'basis-1/3'],
};
```

**Core component pattern** (from RESEARCH.md Pattern 5):
```typescript
export function ColumnGrid({ section }: ColumnGridProps) {
  const basisClasses = COLUMN_CLASSES[section.layoutType];

  return (
    <div className="flex gap-2 p-2">
      {section.slots.map((slot, i) => (
        <div
          key={slot.id}
          data-testid="column-wrapper"
          className={`min-w-0 ${basisClasses[i] ?? 'basis-full'}`}
        >
          <ColumnSlot slot={slot} sectionId={section.id} />
        </div>
      ))}
    </div>
  );
}
```

**Critical pattern notes:**
- `data-testid="column-wrapper"` — required for `ColumnGrid.test.tsx` assertions
- `basisClasses[i] ?? 'basis-full'` — **mandatory** fallback due to `noUncheckedIndexedAccess: true` in `tsconfig.base.json`
- `min-w-0` on every column wrapper — prevents flex overflow when slot content is wide
- `readonly string[]` on the record values — prevents accidental mutation

---

### `apps/client/src/components/builder/ColumnSlot.tsx` (component, request-response)

**Analog:** `apps/client/src/components/dashboard/NewsletterCard.tsx` (conditional render pattern)

**Type aliasing pattern** (specific to this file — avoids naming collision between component `ColumnSlot` and type `ColumnSlot` from `newsletter.ts`):
```typescript
// ColumnSlot.tsx imports:
import React from 'react';
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
import { ElementRenderer } from './ElementRenderer';
```

**Conditional render pattern** (`NewsletterCard.tsx` lines 43–88 — nested conditional JSX):
```typescript
// NewsletterCard pattern (conditional sub-component rendering):
export function NewsletterCard({ newsletter }: Props) {
  // ...
  return (
    <>
      <div ...>
        {/* conditional content */}
      </div>
    </>
  );
}

// ColumnSlot adaptation — early return pattern:
export function ColumnSlot({ slot }: ColumnSlotProps) {
  if (slot.element) {
    return <ElementRenderer element={slot.element} />;
  }
  return (
    <div className="min-h-[80px] flex items-center justify-center border-2 border-dashed border-border rounded text-sm text-muted-foreground select-none">
      Drop element here
    </div>
  );
}
```

**Key pattern notes:**
- `sectionId` prop accepted but unused in Phase 3 — retained for Phase 4 DnD wiring
- `border-border` — uses `--border` CSS token, NOT hardcoded `border-gray-*`
- `select-none` — Phase 4 DnD preparation (prevents text selection during drag)
- `min-h-[80px]` — arbitrary value, not a spacing token (declared as exception in UI-SPEC)

---

### `apps/client/src/components/builder/ElementRenderer.tsx` (component, request-response)

**Analog:** `apps/client/src/components/builder/BuilderHeader.tsx` (minimal pure-render component)

**Imports pattern:**
```typescript
import React from 'react';
import type { ElementUnion } from '../../types/newsletter';
```

**Stub component pattern** (from RESEARCH.md Pattern 7):
```typescript
interface ElementRendererProps {
  element: ElementUnion;
}

// STUB: Phase 3 renders element type name only.
// Phases 5-7 replace this with real element renderers.
export function ElementRenderer({ element }: ElementRendererProps) {
  return (
    <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
      [{element.type}]
    </div>
  );
}
```

**Key pattern notes:**
- `bg-accent` — UI-SPEC reserves `accent` for this stub only; do NOT use elsewhere in Phase 3
- `text-xs` (12px) — smallest type size in Phase 3 typography scale
- `[{element.type}]` — literal bracket notation, not JSX expression
- `min-h-[60px]` — arbitrary exception value (declared in UI-SPEC spacing exceptions table)

---

### `apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx` (test)

**Analog:** `apps/client/src/types/__tests__/newsletter.test-d.ts` (describe/it structure)
**Secondary analog:** `apps/client/src/hooks/__tests__/useNewsletters.test.ts` (stub pattern for Wave 0)

**Test file structure pattern** (`newsletter.test-d.ts` lines 1–10):
```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type {
  ElementUnion,
  NewsletterDoc,
  // ...
} from '../newsletter';

describe('NewsletterDoc type coverage', () => {
  it('ElementUnion covers all 5 element types', () => {
    // ...
  });
```

**RTL render test pattern** (from RESEARCH.md Validation Architecture — test pattern with RTL):
```typescript
// apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { ColumnGrid } from '../ColumnGrid';
import type { Section } from '../../../types/newsletter';

// Factory helper — reused across all 5 layout tests
function makeSection(layoutType: Section['layoutType'], slotCount: number): Section {
  return {
    id: 'test-section',
    layoutType,
    slots: Array.from({ length: slotCount }, (_, i) => ({
      id: `slot-${i}`,
      element: null,
    })),
  };
}

describe('ColumnGrid', () => {
  it('LAYOUT-01: renders 1 column for 1col', () => {
    const { container } = render(<ColumnGrid section={makeSection('1col', 1)} />);
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(1);
    expect(cols[0]).toHaveClass('basis-full');
  });

  it('LAYOUT-02: renders 2 equal columns for 2col', () => {
    const { container } = render(<ColumnGrid section={makeSection('2col', 2)} />);
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols).toHaveLength(2);
    expect(cols[0]).toHaveClass('basis-1/2');
    expect(cols[1]).toHaveClass('basis-1/2');
  });
  // ... LAYOUT-03 through LAYOUT-05 follow same pattern
});
```

**Key notes:**
- `expect(cols[0]).toHaveClass(...)` — requires `@testing-library/jest-dom` (`.toHaveClass` is a jest-dom matcher, not built-in Vitest)
- `container.querySelectorAll('[data-testid="column-wrapper"]')` — targets the `data-testid` attribute that MUST be on ColumnGrid's column wrapper `<div>`
- `cols[0]` — safe because `noUncheckedIndexedAccess` does NOT apply to `NodeListOf` (DOM API, not TypeScript array)

---

### `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` (test)

**Analog:** `apps/client/src/hooks/__tests__/useNewsletters.test.ts` (Wave 0 stub pattern)

**Wave 0 stub pattern** (`useNewsletters.test.ts` lines 1–8):
```typescript
// Stub tests for useNewsletters / useCreateNewsletter hooks (NL-01, NL-02)
// Wave 0: placeholders — implementation fills these in Phase 2 execution
import { describe, it } from 'vitest';

describe('useNewsletters', () => {
  it.todo('returns NewsletterSummary[] when GET /newsletters succeeds');
});
```

**For BuilderCanvas test, adapt to RTL render pattern:**
```typescript
// apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { BuilderCanvas } from '../BuilderCanvas';
import { FIXTURE_DOC } from '../../../fixtures/newsletter.fixture';

describe('BuilderCanvas', () => {
  it('CANVAS-01: renders canvas panel with correct flex class', () => {
    const { container } = render(<BuilderCanvas doc={FIXTURE_DOC} />);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('flex-[3]');
  });

  it('CANVAS-01: renders one RowBlock per fixture section', () => {
    const { container } = render(<BuilderCanvas doc={FIXTURE_DOC} />);
    // 5 sections in FIXTURE_DOC
    // test assertions here
  });

  it('shows empty state when doc is null', () => {
    const { getByText } = render(<BuilderCanvas doc={null} />);
    getByText('No sections yet. Drag a layout from the palette to begin.');
  });
});
```

---

### `apps/client/src/fixtures/newsletter.fixture.ts` (fixture, static data)

**Analog:** None — no fixtures directory currently exists.

**Pattern from RESEARCH.md Pattern 8:**
```typescript
// apps/client/src/fixtures/newsletter.fixture.ts
import type { NewsletterDoc } from '../types/newsletter';

export const FIXTURE_DOC: NewsletterDoc = {
  header: { presetId: 'infineon-default', variables: {} },
  footer: { presetId: 'infineon-default', variables: {} },
  globalStyles: {
    fontFamily:      'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    contentWidth:    600,
    primaryColor:    '#0066cc',
  },
  rows: [
    {
      id:         'fixture-row-1col',
      layoutType: '1col',
      slots:      [{ id: 'fixture-slot-1col-1', element: null }],
    },
    {
      id:         'fixture-row-2col',
      layoutType: '2col',
      slots:      [
        { id: 'fixture-slot-2col-1', element: null },
        { id: 'fixture-slot-2col-2', element: null },
      ],
    },
    {
      id:         'fixture-row-3col',
      layoutType: '3col',
      slots:      [
        { id: 'fixture-slot-3col-1', element: null },
        { id: 'fixture-slot-3col-2', element: null },
        { id: 'fixture-slot-3col-3', element: null },
      ],
    },
    {
      id:         'fixture-row-slbr',
      layoutType: 'small-left-big-right',
      slots:      [
        { id: 'fixture-slot-slbr-1', element: null },
        { id: 'fixture-slot-slbr-2', element: null },
      ],
    },
    {
      id:         'fixture-row-blsr',
      layoutType: 'big-left-small-right',
      slots:      [
        { id: 'fixture-slot-blsr-1', element: null },
        { id: 'fixture-slot-blsr-2', element: null },
      ],
    },
  ],
};
```

**Key notes:**
- Must create `apps/client/src/fixtures/` directory (does not exist yet)
- `import type` only — no runtime imports (static data file)
- All slots have `element: null` — visual fixture for empty-slot rendering
- Exactly 5 sections, one per `LayoutType` value — matches UI-SPEC Dev Fixture Contract

---

### `apps/client/src/pages/BuilderPage.tsx` *(modify)*

**Analog:** Self (existing file — targeted modification only)

**Current state** (`BuilderPage.tsx` lines 1–45 — full file):
```typescript
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNewsletter } from '../hooks/useNewsletters';
import { useNewsletterStore } from '../store/useNewsletterStore';
import { useAutoSave } from '../hooks/useAutoSave';
import BuilderHeader from '../components/builder/BuilderHeader';

export default function BuilderPage() {
  const { id }                       = useParams<{ id: string }>();
  const { data, isPending, isError } = useNewsletter(id!);
  const { setDoc, clearDoc }         = useNewsletterStore();
  const { saveStatus }               = useAutoSave(id!);

  useEffect(() => {
    if (data) setDoc(data.document);
    return () => clearDoc();
  }, [data, setDoc, clearDoc]);

  if (isPending) { /* ... */ }
  if (isError)   { /* ... */ }

  return (
    <div className="flex flex-col h-screen">
      <BuilderHeader id={id!} title={data?.title ?? ''} saveStatus={saveStatus} />
      <main className="flex-1 bg-neutral-100" />   {/* ← THIS LINE IS REPLACED */}
    </div>
  );
}
```

**Modification target** — replace line 42 only:
```typescript
// REMOVE:
<main className="flex-1 bg-neutral-100" />

// REPLACE WITH:
<main className="flex flex-1 overflow-hidden">
  <BuilderCanvas doc={doc} />
  <BuilderPalette />
</main>
```

**New imports to add** (at top of file):
```typescript
import { BuilderCanvas } from '../components/builder/BuilderCanvas';
import { BuilderPalette } from '../components/builder/BuilderPalette';
```

**New Zustand selector to add** (after existing destructuring on line 11):
```typescript
const doc = useNewsletterStore((state) => state.doc);
```

**Zustand selector pattern** (`useNewsletterStore.ts` lines 46–56):
```typescript
// Store already set up; read doc with selector:
const doc = useNewsletterStore((state) => state.doc);
// NOT: useNewsletterStore().doc  (causes full re-render on any store change)
```

**Why `overflow-hidden` on `<main>`** — from RESEARCH.md Pattern 1:
- Constrains both panels to viewport height
- `BuilderCanvas` scrolls via `overflow-y-auto`
- `BuilderPalette` stays full-height without `position: sticky`

---

### `apps/client/src/index.css` *(modify)*

**Analog:** Self (existing `@theme inline` block — targeted addition)

**Current `@theme inline` block** (`index.css` lines 5–41 — final entry is `--color-sidebar-ring`):
```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  /* ... all existing tokens ... */
  --color-sidebar-ring: var(--sidebar-ring);  /* ← currently last entry */
}
```

**Modification** — add one line inside the `@theme inline` block:
```css
@theme inline {
  /* ... existing tokens unchanged ... */
  --color-sidebar-ring: var(--sidebar-ring);
  --color-canvas: #f4f4f5;   /* ADD: BuilderCanvas panel background */
}
```

**Token registration pattern** (existing entries in `index.css` lines 10–27):
```css
--color-background: var(--background);
--color-foreground: var(--foreground);
--color-card: var(--card);
```
> The `--color-canvas` token uses a **direct hex value** (not a CSS variable reference) because `#f4f4f5` has no corresponding semantic variable in the shadcn token set. This enables `className="bg-canvas"` on `BuilderCanvas`. Do NOT use `bg-neutral-100` (≈`#f5f5f5`) — different value.

---

## Shared Patterns

### Named Export Convention (Non-Page Components)
**Source:** `apps/client/src/components/dashboard/NewsletterCard.tsx` line 40; `apps/client/src/components/ui/button.tsx` line 64
**Apply to:** `BuilderCanvas`, `BuilderPalette`, `RowBlock`, `ColumnGrid`, `ColumnSlot`, `ElementRenderer`

```typescript
// ✅ Named export for sub-components:
export function BuilderCanvas({ doc }: BuilderCanvasProps) { ... }
export { Button, buttonVariants }

// ✅ Default export for pages only:
export default function BuilderPage() { ... }
export default function BuilderHeader(...) { ... }
```

### React Import Convention
**Source:** `apps/client/src/components/builder/BuilderHeader.tsx` line 1; `apps/client/src/components/ui/button.tsx` line 1
**Apply to:** All new `.tsx` files

```typescript
// Builder components (hooks/state involved):
import React, { useEffect, useState } from 'react';

// Pure render components (no hooks):
import React from 'react';

// shadcn UI components (CLI-generated):
import * as React from "react"
```

### Path Alias Convention
**Source:** `apps/client/src/components/builder/BuilderHeader.tsx` lines 5–6
**Apply to:** All imports from `@/` base
```typescript
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Configured in: apps/client/vitest.config.ts lines 10-14
// alias: { '@': path.resolve(__dirname, './src') }
```

### Relative Import Convention
**Source:** `apps/client/src/components/builder/BuilderHeader.tsx` lines 7–8
**Apply to:** Sibling/parent imports within `src/`
```typescript
import { useRenameNewsletter } from '../../hooks/useRenameNewsletter';
import type { SaveStatus } from '../../hooks/useAutoSave';
// → Always relative paths for project-internal modules (not @/ for non-ui)
// → `import type` for type-only imports
```

### CSS Token Usage (vs Hardcoded Values)
**Source:** `apps/client/src/components/builder/BuilderHeader.tsx` line 46; `apps/client/src/components/ui/button.tsx` line 17
**Apply to:** All color classes in new components
```typescript
// ✅ Use semantic tokens:
'bg-background'          // → var(--background)
'text-muted-foreground'  // → var(--muted-foreground)
'border-border'          // → var(--border)
'bg-accent'              // → var(--accent)
'text-destructive'       // → var(--destructive)
'bg-canvas'              // → var(--color-canvas) = #f4f4f5 (NEW in Phase 3)

// ❌ Avoid hardcoded values:
'bg-[#f4f4f4]'           // → use bg-canvas instead
'bg-neutral-100'         // → different value (#f5f5f5), not the spec color
```

### `noUncheckedIndexedAccess` Guard Pattern
**Source:** RESEARCH.md Pattern 5 / Pitfall 3; `tsconfig.base.json` confirmed
**Apply to:** `ColumnGrid.tsx` (any array index access)
```typescript
// tsconfig.base.json has noUncheckedIndexedAccess: true
// Array index access returns T | undefined — always add ?? fallback:
const basisClasses = COLUMN_CLASSES[section.layoutType];
className={`min-w-0 ${basisClasses[i] ?? 'basis-full'}`}
//                     ↑ required fallback — TS error without it
```

### Test File Header Convention
**Source:** `apps/client/src/hooks/__tests__/useAutoSave.test.ts` lines 1–3; `apps/client/src/types/__tests__/newsletter.test-d.ts` lines 1–3
**Apply to:** `ColumnGrid.test.tsx`, `BuilderCanvas.test.tsx`
```typescript
// {Description} tests for {ComponentName} ({REQ-IDs})
// Wave 0: placeholders — implementation fills these in Phase 3 execution
import { describe, it } from 'vitest';
```

---

## Infrastructure Setup Patterns

### Wave 0: Test Infrastructure (required before test files work)

**`vitest.config.ts` modification** (`apps/client/vitest.config.ts` current state lines 5–16):
```typescript
// Current (lines 5-16):
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],     // ← MODIFY: add './src/test-setup.ts'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**New `test-setup.ts` file** (create at `apps/client/src/test-setup.ts`):
```typescript
// apps/client/src/test-setup.ts
import '@testing-library/jest-dom';
```

**Dev dependency install command:**
```bash
# from apps/client directory
pnpm add -D @testing-library/react @testing-library/jest-dom
```

### Dev Fixture Route in `main.tsx`

**Current `main.tsx` router** (lines 30–43 — existing routes pattern):
```typescript
const router = createBrowserRouter([
  { path: '/',                element: <DashboardPage /> },
  { path: '/newsletters',     element: <DashboardPage /> },
  { path: '/newsletters/:id', element: <BuilderPage /> },
])
```

**Add dev-only fixture route** (gated by `import.meta.env.DEV`):
```typescript
const router = createBrowserRouter([
  { path: '/',                element: <DashboardPage /> },
  { path: '/newsletters',     element: <DashboardPage /> },
  { path: '/newsletters/:id', element: <BuilderPage /> },
  // DEV ONLY — remove after Phase 4 UAT:
  ...(import.meta.env.DEV ? [
    {
      path: '/dev/canvas-fixture',
      element: <BuilderCanvas doc={FIXTURE_DOC} />,
    },
  ] : []),
])
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/client/src/fixtures/newsletter.fixture.ts` | fixture | static data | No `fixtures/` directory exists; no existing fixture files anywhere in the project |

---

## Metadata

**Analog search scope:** `apps/client/src/` (all subdirectories)
**Files scanned:**
- `apps/client/src/components/builder/BuilderHeader.tsx` (primary analog for all builder components)
- `apps/client/src/pages/BuilderPage.tsx` (modification target)
- `apps/client/src/components/dashboard/NewsletterCard.tsx` (sub-component pattern)
- `apps/client/src/components/ui/button.tsx` (shadcn CLI pattern, static variant map)
- `apps/client/src/components/ui/card.tsx` (shadcn component structure)
- `apps/client/src/store/useNewsletterStore.ts` (Zustand selector pattern)
- `apps/client/src/types/newsletter.ts` (all types used: `LayoutType`, `Section`, `ColumnSlot`, `ElementUnion`, `NewsletterDoc`)
- `apps/client/src/types/__tests__/newsletter.test-d.ts` (describe/it test structure)
- `apps/client/src/hooks/__tests__/useNewsletters.test.ts` (Wave 0 stub pattern)
- `apps/client/src/hooks/__tests__/useAutoSave.test.ts` (test file header convention)
- `apps/client/src/index.css` (CSS theme token addition target)
- `apps/client/src/main.tsx` (router pattern for dev fixture route)
- `apps/client/vitest.config.ts` (test configuration — setupFiles modification target)
- `apps/client/src/lib/utils.ts` (`cn()` utility reference)

**Pattern extraction date:** 2026-06-08
