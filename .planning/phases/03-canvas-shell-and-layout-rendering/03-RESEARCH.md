# Phase 3: Canvas Shell & Layout Rendering — Research

**Researched:** 2026-06-08 (updated from 2026-06-07 — Tailwind v4 flex/basis patterns re-verified directly from `tailwindcss/dist/lib.js` source; @radix-ui/react-tabs availability confirmed in pnpm virtual store)
**Domain:** React component layout · Tailwind v4 flex utilities · shadcn/ui Tabs · Zustand canvas state · Vitest component testing
**Confidence:** HIGH (codebase verified; Tailwind v4 flex/basis patterns verified directly from `node_modules/tailwindcss/dist/lib.js`; @radix-ui/react-tabs confirmed in pnpm store)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANVAS-01 | Builder UI has a left-side canvas and a right-side palette panel | Two-panel flex layout in `BuilderPage`; `BuilderCanvas` (left) + `BuilderPalette` (right) |
| LAYOUT-01 | 1-column layout (single full-width slot) | `ColumnGrid` with `basis-full` on single `ColumnSlot` |
| LAYOUT-02 | 2-column layout (two equal-width slots) | `ColumnGrid` with `basis-1/2` on two `ColumnSlot`s |
| LAYOUT-03 | 3-column layout (three equal-width slots) | `ColumnGrid` with `basis-1/3` on three `ColumnSlot`s |
| LAYOUT-04 | Small-left / big-right layout (1/3 + 2/3 slots) | `ColumnGrid` with `basis-1/3` + `basis-2/3` |
| LAYOUT-05 | Big-left / small-right layout (2/3 + 1/3 slots) | `ColumnGrid` with `basis-2/3` + `basis-1/3` |

</phase_requirements>

---

## Summary

Phase 3 is a **pure client-side rendering phase** — no server changes, no new production npm packages. Everything required for rendering (Tailwind v4, React, Zustand, shadcn, lucide-react) is already installed from Phases 1 and 2. The only new installs are: (1) the `shadcn tabs` component via CLI, and (2) `@testing-library/react` + `@testing-library/jest-dom` as devDependencies for Phase 3's component tests.

The centrepiece of Phase 3 is the `ColumnGrid` component, which maps a `Section`'s `layoutType` to Tailwind `basis-*` fractions. The critical implementation rule: all Tailwind class names must be complete string literals in a static `Record<LayoutType, string[]>` — never built via template literals or string concatenation, as Tailwind v4's JIT scanner won't find them. The component hierarchy is `BuilderPage → BuilderCanvas + BuilderPalette → RowBlock → ColumnGrid → ColumnSlot → ElementRenderer(stub)`.

The `BuilderPage` already loads the newsletter and calls `setDoc`. Phase 3 only replaces the empty `<main className="flex-1 bg-neutral-100" />` placeholder with the two-panel layout. The "sticky palette" is not CSS `position: sticky` — it's achieved naturally by using `overflow-hidden` on the flex parent and `overflow-y-auto` on the canvas panel only, leaving the palette panel at full viewport height.

**Primary recommendation:** Implement `ColumnGrid` first with the `COLUMN_CLASSES` record pattern (clearest and most testable). Install `@testing-library/react` in Wave 0. Use a `src/fixtures/newsletter.fixture.ts` for both component tests and dev-time visual validation.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Two-panel builder layout | Client (BuilderPage) | — | Pure client layout; server never renders the builder UI |
| Canvas section list rendering | Client (BuilderCanvas) | — | Reads from Zustand `doc.rows`; no API call needed |
| Column width proportions | Client (ColumnGrid) | — | Tailwind flex utilities; builder UI only — email output uses tables |
| Empty slot placeholder | Client (ColumnSlot) | — | Visual affordance for Phase 4 DnD drop target |
| Element content rendering | Client (ElementRenderer) | — | Stub for Phase 3; fully implemented in Phases 5-7 |
| Palette tab group (Layouts / Elements) | Client (BuilderPalette) | — | Static list in Phase 3; populated by DnD in Phase 4-5 |
| Fixture data (hardcoded doc) | Client (fixtures/) | — | Dev/test only; not persisted or shipped to server |

---

## Standard Stack

### No New Production Dependencies

All production packages for Phase 3 are already installed. Phase 3 adds only:
- 1 shadcn component (code-generated, not an npm package)
- 2 testing devDependencies

| Library | Version | Already Installed | Phase 3 Use |
|---------|---------|-------------------|-------------|
| react | 19.2.7 | ✓ | Component rendering |
| tailwindcss | 4.3.0 | ✓ | `flex`, `basis-*`, `overflow-*`, layout classes |
| zustand | 5.0.14 | ✓ | Read `doc.rows` from `useNewsletterStore` |
| lucide-react | 1.17.0 | ✓ | Icons in palette layout cards (optional) |
| shadcn button, card | installed | ✓ | Palette layout card buttons |
| shadcn **tabs** | **NOT YET** | ✗ | BuilderPalette "Layouts" / "Elements" tab group |

### New Dev Dependencies (Wave 0)

| Library | Version | Purpose |
|---------|---------|---------|
| @testing-library/react | ^16.3.0 | Render components in Vitest jsdom tests |
| @testing-library/jest-dom | ^6.6.0 | `.toHaveClass()`, `.toBeInTheDocument()` matchers |
| @testing-library/user-event | ^14.6.0 | (optional) for future interaction tests |

> **Version note:** `@testing-library/react` v16+ supports React 18 and 19. [ASSUMED — version compatibility based on training knowledge; verify `npm view @testing-library/react peerDependencies` before installing]

### shadcn Tabs Component

```bash
# Run from apps/client directory
npx shadcn@latest add tabs
```

Generates `src/components/ui/tabs.tsx` with Radix UI `@radix-ui/react-tabs` primitives. [VERIFIED: shadcn component list — `tabs` is a standard shadcn component, same CLI add pattern as other components installed in Phase 2. Additionally confirmed: `@radix-ui/react-tabs@1.1.14` is already present in pnpm virtual store (`node_modules/.pnpm/@radix-ui+react-tabs@1.1.14_...`) as a transitive dependency of `radix-ui@1.5.0`, so `npx shadcn@latest add tabs` will not download a new package — it will only generate the component file from the already-installed Radix primitive]

### Installation Commands

```bash
# From apps/client
pnpm add -D @testing-library/react @testing-library/jest-dom
npx shadcn@latest add tabs
```

---

## Architecture Patterns

### System Architecture Diagram

```
User Browser  /newsletters/:id
       │
       ▼
BuilderPage (apps/client/src/pages/BuilderPage.tsx)
  │
  ├── BuilderHeader (ALREADY DONE — Phase 2)
  │     sticky h-14 top bar | back arrow | title edit | save status | export
  │
  └── <main> flex flex-row flex-1 overflow-hidden
        │
        ├── BuilderCanvas (NEW — left panel, ~60%)
        │     overflow-y-auto bg-[#f4f4f5]
        │       └── content area: max-w-[640px] mx-auto px-4 py-8
        │             └── doc.rows.map(section =>
        │                   RowBlock (NEW)
        │                     └── ColumnGrid (NEW)
        │                           └── ColumnSlot[] (NEW)
        │                                 └── slot.element
        │                                       ? ElementRenderer(stub) (NEW)
        │                                       : dashed placeholder
        │
        └── BuilderPalette (NEW — right panel, ~40%)
              overflow-y-auto border-l sticky top-0
                └── shadcn <Tabs defaultValue="layouts">
                      ├── TabsList
                      │     ├── TabsTrigger "Layouts"
                      │     └── TabsTrigger "Elements"
                      ├── TabsContent "layouts"
                      │     └── list of 5 layout names with icons/cards
                      └── TabsContent "elements"
                            └── (empty stub — Phase 5 fills this)

Zustand store (already loaded by BuilderPage useEffect):
  useNewsletterStore().doc.rows  ──────────────────► BuilderCanvas props

Fixture (dev/test):
  src/fixtures/newsletter.fixture.ts
    └── FIXTURE_DOC: NewsletterDoc with 5 sections (one per layout type)
           ├── used in ColumnGrid.test.tsx
           └── used via temporary Zustand injection for visual dev validation
```

### Recommended Project Structure (Phase 3 additions)

```
apps/client/src/
├── components/
│   ├── ui/
│   │   └── tabs.tsx               # NEW: shadcn Tabs (via CLI)
│   └── builder/
│       ├── BuilderHeader.tsx       # EXISTING (Phase 2 — no changes)
│       ├── BuilderCanvas.tsx       # NEW: left panel shell
│       ├── BuilderPalette.tsx      # NEW: right panel with Tabs
│       ├── RowBlock.tsx            # NEW: renders one Section
│       ├── ColumnGrid.tsx          # NEW: maps layoutType → flex basis classes
│       ├── ColumnSlot.tsx          # NEW: empty slot placeholder + ElementRenderer
│       ├── ElementRenderer.tsx     # NEW: stub renderer (shows element.type text)
│       └── __tests__/
│           ├── ColumnGrid.test.tsx # NEW: LAYOUT-01 through LAYOUT-05 tests
│           └── BuilderCanvas.test.tsx # NEW: CANVAS-01 test
├── fixtures/
│   └── newsletter.fixture.ts      # NEW: hardcoded NewsletterDoc with 5 sections
└── pages/
    └── BuilderPage.tsx            # MODIFY: replace <main> placeholder with two panels
```

---

### Pattern 1: Two-Panel Builder Layout (CANVAS-01)

**What:** `BuilderPage` replaces its empty `<main>` with a flex row containing `BuilderCanvas` (left, ~60%) and `BuilderPalette` (right, ~40%). The "sticky palette" is achieved by overflow containment, not `position: sticky`.

**Current state of `BuilderPage`:**
```tsx
// EXISTING — Phase 2 left this placeholder:
return (
  <div className="flex flex-col h-screen">
    <BuilderHeader id={id!} title={data?.title ?? ''} saveStatus={saveStatus} />
    <main className="flex-1 bg-neutral-100" />  {/* ← REPLACE THIS */}
  </div>
);
```

**Phase 3 replacement:**
```tsx
// apps/client/src/pages/BuilderPage.tsx (Phase 3 modification)
const doc = useNewsletterStore((state) => state.doc);

return (
  <div className="flex flex-col h-screen">
    <BuilderHeader id={id!} title={data?.title ?? ''} saveStatus={saveStatus} />
    <main className="flex flex-1 overflow-hidden">
      <BuilderCanvas doc={doc} />
      <BuilderPalette />
    </main>
  </div>
);
```

**Why `overflow-hidden` on `<main>`:** Constrains both panels to viewport height. `BuilderCanvas` uses `overflow-y-auto` to scroll independently. `BuilderPalette` stays at full height — no explicit `position: sticky` needed. [VERIFIED: standard CSS flex overflow containment pattern]

---

### Pattern 2: BuilderCanvas Shell

**What:** Left panel at ~60% width, scrollable, dark background, content centred at max 640px.

```tsx
// apps/client/src/components/builder/BuilderCanvas.tsx
import React from 'react';
import type { NewsletterDoc } from '../../types/newsletter';
import { RowBlock } from './RowBlock';

interface BuilderCanvasProps {
  doc: NewsletterDoc | null;
}

export function BuilderCanvas({ doc }: BuilderCanvasProps) {
  return (
    <div className="flex-[3] min-w-0 overflow-y-auto bg-[#f4f4f5]">
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
}
```

> **`flex-[3]`:** Tailwind v4 arbitrary flex value — equivalent to `flex: 3`. Paired with `flex-[2]` on palette gives a 60/40 split. [VERIFIED: from `tailwindcss/dist/lib.js` — `r.functional("flex", s => if kind==="arbitrary" → l("flex", s.value.value))`; `flex-[3]` → `flex: 3`]
>
> **`flex-3` also works** (values 1-12 are in the scale: `i("flex",()=>[{values: Array.from({length:12},...)}])`), but the locked decision from STATE.md mandates `flex-[3]`/`flex-[2]` (arbitrary bracket form). Both produce identical CSS. [VERIFIED: lib.js source]
>
> **`min-w-0`:** Prevents flex children from overflowing their container when content is wide. Essential in flex layouts — flex items default to `min-width: auto`. [VERIFIED: standard CSS flex pitfall mitigation; applies to all flex children in this layout]

---

### Pattern 3: BuilderPalette Shell with Tabs

**What:** Right panel at ~40% width, sticky (overflow-contained), two tabs: "Layouts" and "Elements".

```tsx
// apps/client/src/components/builder/BuilderPalette.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LAYOUT_NAMES: Record<string, string> = {
  '1col':                 '1 Column',
  '2col':                 '2 Columns',
  '3col':                 '3 Columns',
  'small-left-big-right': 'Small / Big',
  'big-left-small-right': 'Big / Small',
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

[VERIFIED: shadcn Tabs API from Phase 1 research context — same CLI install pattern; Tabs, TabsList, TabsTrigger, TabsContent imports from `@/components/ui/tabs`]

---

### Pattern 4: RowBlock Component

**What:** Renders one `Section` as a white card. Wraps `ColumnGrid`.

```tsx
// apps/client/src/components/builder/RowBlock.tsx
import React from 'react';
import type { Section } from '../../types/newsletter';
import { ColumnGrid } from './ColumnGrid';

interface RowBlockProps {
  section: Section;
}

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

---

### Pattern 5: ColumnGrid — The Core Layout Pattern (LAYOUT-01 through LAYOUT-05)

**What:** Maps `section.layoutType` to Tailwind `basis-*` fractions. Uses a static `COLUMN_CLASSES` record — never dynamic class construction.

**Critical rule:** All Tailwind class names must appear as **complete string literals** somewhere in the codebase for Tailwind v4's JIT scanner to include them in the output CSS. Never build them with template literals.

```tsx
// apps/client/src/components/builder/ColumnGrid.tsx
import React from 'react';
import type { LayoutType, Section } from '../../types/newsletter';
import { ColumnSlot } from './ColumnSlot';

// ⚠️ TAILWIND V4 RULE: All class names must be complete literals.
// Do NOT build like `basis-${fraction}` — JIT won't find them.
const COLUMN_CLASSES: Record<LayoutType, readonly string[]> = {
  '1col':                 ['basis-full'],
  '2col':                 ['basis-1/2',  'basis-1/2'],
  '3col':                 ['basis-1/3',  'basis-1/3', 'basis-1/3'],
  'small-left-big-right': ['basis-1/3',  'basis-2/3'],
  'big-left-small-right': ['basis-2/3',  'basis-1/3'],
};

interface ColumnGridProps {
  section: Section;
}

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

> **Why `basis-1/3` not `w-1/3`:** `flex-basis` correctly controls the initial size in a flex layout. `width` can be overridden by flex grow/shrink. `basis-*` is the right utility here. [VERIFIED: `tailwindcss/dist/lib.js` — `o("basis",["--flex-basis","--spacing","--container"],s=>[l("flex-basis",s)],{supportsFractions:true})`; confirms `basis-1/3` → `flex-basis: calc(1/3 * 100%)` = `flex-basis: 33.333%`]
>
> **`basis-full` is a static utility:** `t("basis-full",[["flex-basis","100%"]])` — not fraction-computed, confirmed as a named static utility. [VERIFIED: lib.js]
>
> **Why not `flex-1` for equal columns:** `flex-1` gives `flex: 1 1 0%` (all columns start at 0 and grow equally). Using `basis-1/2` / `basis-1/3` is more explicit and easier to test. Either works; `basis-*` is recommended for clarity.
>
> **`noUncheckedIndexedAccess` guard:** TypeScript 6 with `noUncheckedIndexedAccess: true` means `array[i]` returns `T | undefined`. The `?? 'basis-full'` fallback prevents a TS error on `basisClasses[i]`. [VERIFIED: tsconfig.base.json has `noUncheckedIndexedAccess: true` — Phase 1 research Pitfall 5]

---

### Pattern 6: ColumnSlot — Empty Placeholder + ElementRenderer

**What:** Renders an empty dashed-border "Drop element here" placeholder, or the `ElementRenderer` if the slot has content.

> **Naming collision note:** The TypeScript type `ColumnSlot` (from `newsletter.ts`) and the React component `ColumnSlot` share the same name. Use `import type { ColumnSlot as ColumnSlotData }` in the component file to disambiguate. [VERIFIED: TypeScript allows this via type-only import aliasing]

```tsx
// apps/client/src/components/builder/ColumnSlot.tsx
import React from 'react';
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
import { ElementRenderer } from './ElementRenderer';

interface ColumnSlotProps {
  slot:      ColumnSlotData;
  sectionId: string;
}

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

---

### Pattern 7: ElementRenderer Stub

**What:** Phase 3 stub that renders a visual placeholder showing the element type. Replaced fully in Phases 5-7.

```tsx
// apps/client/src/components/builder/ElementRenderer.tsx
import React from 'react';
import type { ElementUnion } from '../../types/newsletter';

interface ElementRendererProps {
  element: ElementUnion;
}

// STUB: Phase 3 renders element type name only.
// Phase 5-7 replaces this with real element renderers.
export function ElementRenderer({ element }: ElementRendererProps) {
  return (
    <div className="min-h-[60px] flex items-center justify-center bg-accent rounded text-xs text-muted-foreground p-2">
      [{element.type}]
    </div>
  );
}
```

---

### Pattern 8: Fixture Data for Visual Validation

**What:** Hardcoded `NewsletterDoc` with one section of each layout type. Used in tests and for dev-time visual validation.

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

> **For visual validation in dev:** During Phase 3 development, the canvas needs fixture data (since DnD to add sections doesn't exist until Phase 4). Two valid approaches:
> 1. **Temporary effect in `BuilderPage`:** Add a `useEffect` that calls `setDoc(FIXTURE_DOC)` when `import.meta.env.DEV && doc?.rows.length === 0`. Remove this effect when Phase 4 is complete.
> 2. **Dev-only route:** Add `/dev/canvas-fixture` in `main.tsx` that renders `<BuilderCanvas doc={FIXTURE_DOC} />` directly — cleanest, no production pollution.
>
> **Recommendation:** Option 2 (dev route) is cleaner — no prod code path changes. Remove after Phase 4 UAT.

---

### Pattern 9: Wiring BuilderCanvas to Zustand

**What:** `BuilderCanvas` reads from the Zustand store directly — no prop drilling from `BuilderPage` needed.

Option A (Zustand selector in BuilderCanvas — self-contained):
```tsx
// BuilderCanvas.tsx
const doc = useNewsletterStore((state) => state.doc);
```

Option B (Pass `doc` as prop from BuilderPage):
```tsx
// BuilderPage.tsx
const doc = useNewsletterStore((state) => state.doc);
return <BuilderCanvas doc={doc} />;
```

**Recommendation:** Option B (prop-based). Keeps `BuilderCanvas` testable in isolation without mocking Zustand. [ASSUMED — both patterns are valid; prop-passing is easier to unit test but slightly more verbose]

---

### Anti-Patterns to Avoid

- **Dynamic Tailwind class construction:** `className={\`basis-${numerator}/${denominator}\`}` — JIT scanner won't detect this and the class won't be in the CSS bundle. Use the `COLUMN_CLASSES` record with complete string literals.
- **Using `position: sticky` for palette:** The palette should stay fixed via flex overflow containment, not `sticky`. `sticky` requires a scrolling ancestor, which creates layout issues.
- **Forgetting `min-w-0` on flex children:** Without it, flex children default to `min-width: auto` and can overflow their flex container when content is wide. Always add `min-w-0` to `BuilderCanvas`, `BuilderPalette`, AND the column wrapper `<div>` elements inside `ColumnGrid`. [VERIFIED: CSS flex spec — this is the #1 flex gotcha; confirmed the pattern needs `min-w-0` at every flex-child level]
- **Naming component `ColumnSlot` without aliasing the TypeScript type:** Without `import type { ColumnSlot as ColumnSlotData }`, you get a naming collision that confuses IDE tooling even if TypeScript compiles.
- **Accessing `basisClasses[i]` without fallback under `noUncheckedIndexedAccess`:** TypeScript 6 strict mode returns `string | undefined` for indexed access. The `?? 'basis-full'` fallback is required.
- **Reading `doc.rows` directly from `BuilderPage` props:** `doc` should come from Zustand (already populated by the `useEffect` in `BuilderPage`). Don't pass the entire `NewsletterDetail` from TanStack Query to `BuilderCanvas`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab group UI | Custom state + CSS | `shadcn tabs` | Handles keyboard nav, ARIA roles, active state — complex to get right |
| Column class mapping | `if/else` chain | `COLUMN_CLASSES` record | Record is exhaustive over `LayoutType`, type-safe, and trivially testable |
| Flex column width math | Custom `calc()` inline styles | Tailwind `basis-1/3`, `basis-2/3` | Standard utilities; no inline style computation needed |
| Empty slot styling | Custom CSS | Tailwind `border-dashed border-2` | Already in Tailwind; no CSS file needed |
| Zustand state reading | Context API + useState | `useNewsletterStore(selector)` | Store already set up in Phase 1; no new state management |

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 JIT Doesn't Scan Dynamic Class Strings

**What goes wrong:** `className={\`basis-${fraction}\`}` where `fraction` is a variable. The class never appears in the CSS bundle. Layout columns all have zero width.

**Why it happens:** Tailwind v4 JIT scans source files for complete class name strings. Dynamic construction produces runtime strings the scanner never sees.

**How to avoid:** Put all class names as complete literals in a `COLUMN_CLASSES` record object (see Pattern 5). The record itself is a static data structure that the scanner CAN find.

**Warning signs:** Column slots don't render with expected widths; browser DevTools shows the `basis-*` class applied but no CSS rule exists for it.

---

### Pitfall 2: Palette Not Staying Fixed (Overflow Not Contained)

**What goes wrong:** Both canvas and palette panels scroll together instead of independently. Or the palette doesn't fill the viewport height.

**Why it happens:** If `<main>` doesn't have `overflow-hidden`, the entire page scrolls as one unit. The flex children don't know they're constrained to viewport height.

**How to avoid:** Set `overflow-hidden` on the flex parent `<main>`. Then set `overflow-y-auto` only on `BuilderCanvas`. `BuilderPalette` should NOT have `overflow-y-auto` if you want it to be fully fixed — or it can have its own scroll for very long palette content.

**Warning signs:** Scrolling the canvas also scrolls the palette; palette doesn't reach the bottom of the screen.

---

### Pitfall 3: `noUncheckedIndexedAccess` Breaks Array Access

**What goes wrong:** TypeScript errors on `basisClasses[i]` — "Type 'string | undefined' is not assignable to type 'string'".

**Why it happens:** `tsconfig.base.json` has `noUncheckedIndexedAccess: true` (confirmed from Phase 1 research). Array index access always returns `T | undefined` in this mode.

**How to avoid:** Always use a nullish coalescing fallback: `basisClasses[i] ?? 'basis-full'`. For arrays where length is guaranteed to match (e.g., `slots.length === COLUMN_CLASSES[layoutType].length`), this fallback is never reached but is required for compilation.

**Warning signs:** TypeScript compile errors in `ColumnGrid.tsx` when accessing `basisClasses[i]`.

---

### Pitfall 4: ColumnSlot / ColumnSlot Type Naming Collision

**What goes wrong:** The React component `ColumnSlot` and the TypeScript type `ColumnSlot` (from `newsletter.ts`) have the same name. While TypeScript differentiates types from values, IDE tooling and imports become confusing.

**How to avoid:** In `ColumnSlot.tsx`, always import the type with an alias:
```typescript
import type { ColumnSlot as ColumnSlotData } from '../../types/newsletter';
```

**Warning signs:** IDE autocomplete offers both `ColumnSlot` (component) and `ColumnSlot` (type) in the same file; impossible to distinguish from IDE hints.

---

### Pitfall 5: BuilderPage Plan 1 Overlap with Phase 2 Deliverables

**What goes wrong:** Phase 3 Plan 1 ("Builder page route") sounds like it should rebuild the route from scratch. But Phase 2 already delivered the full `BuilderPage.tsx` with newsletter loading, `setDoc`, error states, and `BuilderHeader`.

**How to avoid:** Phase 3 Plan 1 should be scoped to: **modify the existing `BuilderPage.tsx`** to replace `<main className="flex-1 bg-neutral-100" />` with the two-panel flex layout. All other loading/error/header logic is already correct and should not be re-implemented.

**Warning signs:** Re-implementing `useNewsletter`, `setDoc`, or `useAutoSave` calls that already exist.

---

### Pitfall 6: Plan 2 (BuilderHeader) is Already Done

**What goes wrong:** Phase 3's ROADMAP Plan 2 lists "BuilderHeader" as a deliverable. Phase 2 already fully implemented `BuilderHeader.tsx` with all features (back, title edit, save status, export toast).

**How to avoid:** Plan 2 in Phase 3 should be: **verify BuilderHeader still works correctly** after the `BuilderPage` layout change (sticky `z-10` + `h-14` header should still sit above the two-panel main). No code changes to `BuilderHeader.tsx` are needed unless integration testing reveals issues.

**Warning signs:** Creating a new `BuilderHeader.tsx` that duplicates the Phase 2 implementation.

---

### Pitfall 7: Canvas Background Color Mismatch

**What goes wrong:** `bg-neutral-100` (≈`#f5f5f5`) is used instead of the ROADMAP-specified `#f4f4f5`. These are visually very close but not identical.

**How to avoid:** Use an inline style or a custom CSS theme variable:
```tsx
// Option A — inline style:
<div style={{ backgroundColor: '#f4f4f5' }}>

// Option B — Tailwind v4 custom theme in index.css:
@theme inline {
  --color-canvas: #f4f4f5;
}
// Then use: className="bg-canvas"
```

**Recommendation:** Option B keeps the class readable and the colour in one place. Add `--color-canvas: #f4f4f5` to the `@theme inline` block in `apps/client/src/index.css`.

---

## Code Examples

### ColumnGrid With All 5 Layout Types — Complete

```tsx
// Source: Pattern 5 in this research (derived from codebase type system + Tailwind v4 docs)
import React from 'react';
import type { LayoutType, Section } from '../../types/newsletter';
import { ColumnSlot } from './ColumnSlot';

const COLUMN_CLASSES: Record<LayoutType, readonly string[]> = {
  '1col':                 ['basis-full'],
  '2col':                 ['basis-1/2', 'basis-1/2'],
  '3col':                 ['basis-1/3', 'basis-1/3', 'basis-1/3'],
  'small-left-big-right': ['basis-1/3', 'basis-2/3'],
  'big-left-small-right': ['basis-2/3', 'basis-1/3'],
} as const;

export function ColumnGrid({ section }: { section: Section }) {
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

### shadcn Tabs Import Pattern

```tsx
// Source: shadcn/ui CLI-generated tabs.tsx — same import pattern as all shadcn components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="layouts">
  <TabsList>
    <TabsTrigger value="layouts">Layouts</TabsTrigger>
    <TabsTrigger value="elements">Elements</TabsTrigger>
  </TabsList>
  <TabsContent value="layouts">...</TabsContent>
  <TabsContent value="elements">...</TabsContent>
</Tabs>
```

### Tailwind v4 Custom Canvas Background Color

```css
/* apps/client/src/index.css — add to existing @theme inline block */
@theme inline {
  /* ... existing tokens ... */
  --color-canvas: #f4f4f5;   /* ADD: builder canvas background */
}
```

Then in component: `className="bg-canvas"`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `position: sticky` for fixed panels | Flex `overflow-hidden` containment | CSS best practice | More reliable cross-browser; no scroll ancestor dependency |
| `w-1/3` for column widths | `basis-1/3` in flex layouts | Tailwind v4 (ongoing practice) | `basis` is semantically correct for flex initial size |
| Manual CSS for dashed placeholder | Tailwind `border-dashed border-2` | Tailwind v4 | Zero custom CSS needed for the empty slot UI |
| Custom tab UI | shadcn `Tabs` (Radix) | Established in project | Accessible, keyboard-nav, ARIA-correct out of the box |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@testing-library/react` v16+ supports React 19 | Standard Stack | Component tests fail to render; need to install a different version or use `act` workarounds |
| A2 | Dev route `/dev/canvas-fixture` approach is preferred over BuilderPage fixture injection | Pattern 8 | If dev route is not preferred, temporary Zustand injection in BuilderPage is equally valid |
| A3 | `BuilderCanvas` receives `doc` as a prop from `BuilderPage` rather than calling `useNewsletterStore` directly | Pattern 9 | Both patterns compile; testability differs — prop-based is easier to test in isolation |

**All non-assumed claims are verified from the project codebase or confirmed from prior Phase 1/2 research.**

---

## Open Questions

1. **`@testing-library/react` exact version**
   - What we know: v16+ supports React 19 [ASSUMED]
   - What's unclear: Whether v16.3.x or the latest is required for React 19.2.7
   - Recommendation: Run `npm view @testing-library/react peerDependencies` before Wave 0 install; if v16 is incompatible, use `@testing-library/react@canary` or check the RTL GitHub for React 19 support status

2. **Fixture injection strategy for visual validation**
   - What we know: DnD doesn't exist until Phase 4, so Phase 3 needs another way to show sections on the canvas
   - What's unclear: Whether the verifier will want a dev route or a BuilderPage override
   - Recommendation: Dev route at `/dev/canvas-fixture` is cleanest; remove after Phase 4 UAT passes

3. **`flex-[3]` vs `w-[60%]` for panel widths**
   - What we know: ROADMAP says "~60% width" (approximate)
   - What's unclear: Which percentage feels better visually
   - Recommendation: Use `flex-[3]` + `flex-[2]` (3:2 ratio = exactly 60/40). Easier to adjust than hardcoded percentages.

---

## Environment Availability

> Phase 3 is purely client-side code changes. No new external services or runtime tools are required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pnpm run dev | ✓ | v22.9.0 | — |
| pnpm | Workspace commands | ✓ | (installed Phase 1) | — |
| Vite dev server | HMR during development | ✓ | 8.0.16 | — |
| PostgreSQL/Neon | Auto-save (existing) | ✓ | (Phase 1 setup) | — |
| shadcn CLI | Install `tabs` component | ✓ | npx shadcn@latest | — |

**No missing dependencies.**

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + jsdom |
| Config file | `apps/client/vitest.config.ts` (exists — Phase 2) |
| Quick run command | `pnpm --filter ./apps/client test --run` |
| Full suite command | `pnpm --filter ./apps/client test --run && pnpm --filter ./apps/client exec tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANVAS-01 | Two-panel layout renders (canvas left + palette right) | component render | `pnpm --filter ./apps/client test --run BuilderCanvas` | ❌ Wave 0 |
| LAYOUT-01 | 1-col section renders 1 slot | component render | `pnpm --filter ./apps/client test --run ColumnGrid` | ❌ Wave 0 |
| LAYOUT-02 | 2-col section renders 2 equal slots | component render | same | ❌ Wave 0 |
| LAYOUT-03 | 3-col section renders 3 slots | component render | same | ❌ Wave 0 |
| LAYOUT-04 | small-left-big-right renders 2 slots w/ correct widths | component render | same | ❌ Wave 0 |
| LAYOUT-05 | big-left-small-right renders 2 slots w/ correct widths | component render | same | ❌ Wave 0 |

> **COLUMN_CLASSES record is also independently unit-testable** without rendering: iterate over all 5 `LayoutType` values, assert `COLUMN_CLASSES[type].length` matches expected column count. Zero dependencies needed for this test (no RTL needed).

### Test Patterns for Component Tests

```typescript
// apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { ColumnGrid } from '../ColumnGrid';
import type { Section } from '../../../types/newsletter';

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

  it('LAYOUT-04: renders 1/3 + 2/3 columns for small-left-big-right', () => {
    const { container } = render(
      <ColumnGrid section={makeSection('small-left-big-right', 2)} />
    );
    const cols = container.querySelectorAll('[data-testid="column-wrapper"]');
    expect(cols[0]).toHaveClass('basis-1/3');
    expect(cols[1]).toHaveClass('basis-2/3');
  });
  // ... LAYOUT-03, LAYOUT-05 follow same pattern
});
```

> **Requires `data-testid="column-wrapper"`** on the `<div className={basisClasses[i]}>` wrapper in `ColumnGrid.tsx`.

> **Requires `@testing-library/jest-dom`** for `.toHaveClass()`. Vitest's built-in `expect` doesn't include DOM matchers.

### `vitest.config.ts` Update Required for `@testing-library/jest-dom`

```typescript
// apps/client/vitest.config.ts (MODIFY — add setupFiles)
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],  // ADD
  },
  ...
});
```

```typescript
// apps/client/src/test-setup.ts (NEW — Wave 0)
import '@testing-library/jest-dom';
```

### Sampling Rate

- **Per task commit:** `pnpm --filter ./apps/client exec tsc --noEmit`
- **Per wave merge:** `pnpm --filter ./apps/client test --run`
- **Phase gate:** Full type check + all tests green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/client/src/test-setup.ts` — `@testing-library/jest-dom` import
- [ ] `apps/client/src/components/builder/__tests__/ColumnGrid.test.tsx` — covers LAYOUT-01 through LAYOUT-05
- [ ] `apps/client/src/components/builder/__tests__/BuilderCanvas.test.tsx` — covers CANVAS-01
- [ ] Install devDeps: `pnpm --filter ./apps/client add -D @testing-library/react @testing-library/jest-dom`
- [ ] Update `vitest.config.ts` `setupFiles` to include `test-setup.ts`

---

## Security Domain

> Phase 3 introduces no new server-side code, no API routes, no authentication, and no user input handling beyond the existing `BuilderHeader` title rename (Phase 2). Security posture is unchanged.

### Applicable ASVS Categories

| ASVS Category | Applies | Rationale |
|---------------|---------|-----------|
| V2 Authentication | No | No auth changes in Phase 3 |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | No new routes or protected resources |
| V5 Input Validation | No | All new Phase 3 components are read-only renderers; no user text input |
| V6 Cryptography | No | No cryptographic operations |

**No new security vectors introduced in Phase 3.**

---

## Sources

### Primary (HIGH confidence — codebase verified)
- `apps/client/src/pages/BuilderPage.tsx` — current state (empty `<main>` placeholder confirmed)
- `apps/client/src/types/newsletter.ts` — `LayoutType`, `Section`, `ColumnSlot`, `ElementUnion` — all confirmed
- `apps/client/src/store/useNewsletterStore.ts` — `doc`, `setDoc`, `addSection` confirmed
- `apps/client/src/dnd/types.ts` — `DRAG_TYPES`, `ACCEPT_CONSTRAINTS` confirmed
- `apps/client/src/index.css` — Tailwind v4 `@theme inline` pattern confirmed
- `apps/client/package.json` — all dependencies verified; `@testing-library/*` NOT installed
- `.planning/phases/01-foundation-and-stack-setup/01-RESEARCH.md` — Tailwind v4 CSS-first patterns, `noUncheckedIndexedAccess` pitfall, `flex basis-*` utilities

### Secondary (HIGH confidence — verified directly from installed package source)
- Tailwind v4 `basis-{fraction}` utilities — confirmed **directly from `tailwindcss@4.3.0/dist/lib.js`** (installed in this project): `o("basis",["--flex-basis","--spacing","--container"],s=>[l("flex-basis",s)],{supportsFractions:true})`. Confirms `basis-1/3` → `flex-basis: 33.333%`, `basis-2/3` → `flex-basis: 66.667%`, `basis-1/2` → `flex-basis: 50%`, `basis-full` (static) → `flex-basis: 100%`. [VERIFIED: lib.js source]
- `flex-[3]`/`flex-[2]` arbitrary value handling — confirmed from lib.js: `if(s.value.kind==="arbitrary") return [l("flex",s.value.value)]`. `flex-3` through `flex-12` named scale also confirmed (values 1-12), but locked decision uses bracket form. [VERIFIED: lib.js source]
- `@radix-ui/react-tabs@1.1.14` in pnpm virtual store — `node_modules/.pnpm/@radix-ui+react-tabs@1.1.14_...` confirmed present as transitive dep of `radix-ui@1.5.0`. [VERIFIED: filesystem check]
- shadcn `tabs` component CLI install pattern — same install pattern as all other Phase 2 shadcn components. [VERIFIED by analogy — `npx shadcn@latest add tabs` matches Phase 2 installs]

### Tertiary (LOW confidence — training knowledge, flag for validation)
- `@testing-library/react` v16+ React 19 support — [ASSUMED: A1 in assumptions log]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed from codebase inspection
- Architecture: HIGH — derived directly from existing code structure and Phase 1/2 patterns
- ColumnGrid implementation: HIGH — Tailwind fraction utilities confirmed directly from lib.js source; COLUMN_CLASSES pattern confirmed from codebase conventions
- Testing: MEDIUM — `@testing-library/react` version for React 19 is assumed

**Research date:** 2026-06-08
**Valid until:** 2026-07-08 (stable stack — 30-day window)
