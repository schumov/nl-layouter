# Phase 6: Image & Button Elements - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 replaces the `ElementRenderer` stub with real canvas renderers for image, image-link, and button elements, and replaces the InspectorPanel placeholder body with type-routed editors (ImageEditor for image/image-link, ButtonEditor for button). The `updateElement(slotId, patch)` store action is added so every editor field change produces a live canvas update. Rich text and divider are explicitly out of scope — Phase 7 owns them.

**Out of scope:** RichTextElement renderer/editor, DividerElement renderer/editor, image crop/zoom/fit controls, undo/redo, drag between slots.

</domain>

<decisions>
## Implementation Decisions

### Image Empty-State (canvas renderer)
- **D-01:** When an `ImageElement` has `src === ''` (freshly dropped, no URL entered yet), the canvas slot shows a **branded placeholder**: the `Image` lucide icon centered + "Add image URL" prompt text beneath it. Background is `bg-accent` (muted) to frame the area clearly.
- **D-02:** Minimum height for image slots: **70px**. Applies to both the empty-state placeholder and the rendered `<img>` (prevents zero-height collapsed slot when `src` is set but image hasn't loaded yet).

### Image Width Input (InspectorPanel editor)
- **D-03:** Width is a **free-form text field** — user types `100%` or `300px` directly. No number+unit toggle. Default value: `100%`.
- **D-04:** The field is labelled "Width" with placeholder `e.g. 100% or 300px`. No validation — raw string stored in `ImageElement.width` and used as-is in the canvas `style` attribute.

### Button Style Scope
- **D-05:** Phase 6 implements **two** button style variants: `solid` (filled background) and `outline` (transparent background, border). `ghost` is defined in the type system but is **NOT** rendered or available in the editor in Phase 6.
- **D-06:** Style picker UI: **segmented button group** (two buttons side by side: "Filled" | "Outline"). Standard shadcn `Button` component with `variant="outline"` for the inactive state and `variant="default"` for active. No dropdown.

### Live Update Behavior
- **D-07:** **All editor fields dispatch `updateElement` immediately on every `onChange`** — no debouncing, no on-blur delay. This includes URL fields (src, href). The canvas re-renders on every keystroke. The auto-save (1500ms debounce) in the Zustand subscription handles the server persistence — no additional debounce needed at the editor layer.

### InspectorPanel Prop Change (Phase 6 upgrade)
- **D-08:** Phase 6 changes `InspectorPanel`'s prop from `elementType: ElementUnion['type']` to `element: ElementUnion`. The element type is derived from `element.type`. The full element object is passed so editors can read current field values directly from props (no Zustand read inside editors). `onBack` prop is unchanged.
- **D-09:** `BuilderPage` already derives `selectedElementType` from `selectedElementId` → slot lookup; Phase 6 extends this to pass the full element object to InspectorPanel: `element={selectedElement}`.

### Renderers
- **D-10:** `ImageRenderer` renders `<img src={element.src} alt={element.alt} style={{ width: element.width ?? '100%', objectFit: 'cover' }}>` when `src` is non-empty. Empty-state (D-01) shown when `src === ''`.
- **D-11:** `ImageLinkRenderer` wraps `<ImageRenderer>` in `<a href={element.href} target="_blank" rel="noopener noreferrer">`. In the builder canvas, a small link badge (`ExternalLink` lucide icon, 14px, absolute top-right) is overlaid to indicate the image is a link. The badge is hidden in export output (builder-only visual hint).
- **D-12:** `ButtonRenderer` renders a full-width-centered button. `solid` variant: `background: element.backgroundColor; color: element.textColor; border: none`. `outline` variant: `background: transparent; color: element.backgroundColor; border: 2px solid element.backgroundColor`. Uses inline styles (not Tailwind classes) for configurable colours, per CC-2/CC-6 email compatibility.

### the agent's Discretion
- Exact padding/border-radius defaults for the image placeholder frame.
- `ExternalLink` badge exact sizing and positioning (top-right corner, absolute within `relative` wrapper).
- Whether `ButtonRenderer` uses a `<button>` or `<a>` tag in the builder (either is fine; export uses `<a>` with `href`).
- Layout of editor fields within `ImageEditor` and `ButtonEditor` (label spacing, field order, section dividers).
- Whether color pickers show a hex text display alongside the native `<input type="color">` (ROADMAP says yes; implementation details deferred to planner).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 6 plan descriptions (6 plans) and Done When criteria (ELEM-01..ELEM-05)
- `.planning/REQUIREMENTS.md` — ELEM-01, ELEM-02, ELEM-03, ELEM-04, ELEM-05

### Type System (Phase 1 — locked)
- `apps/client/src/types/newsletter.ts` — `ImageElement`, `ImageLinkElement`, `ButtonElement`, `ElementUnion`, `assertNeverElement` — canonical element types; `ButtonElement.style` is `'solid' | 'outline' | 'ghost'`

### Existing Store (to extend)
- `apps/client/src/store/useNewsletterStore.ts` — Phase 6 adds `updateElement(slotId, patch)` action; existing `addElement`, `removeElement`, `selectedElementId` carry forward

### Canvas Components (to modify/replace)
- `apps/client/src/components/builder/ElementRenderer.tsx` — current stub; Phase 6 replaces body with switch on `element.type` → `ImageRenderer` | `ImageLinkRenderer` | `ButtonRenderer` | fallback stub for rich-text/divider
- `apps/client/src/components/builder/InspectorPanel.tsx` — Phase 5 placeholder; Phase 6 changes prop to `element: ElementUnion` and replaces placeholder body with type-routed editors
- `apps/client/src/pages/BuilderPage.tsx` — passes `selectedElement` (full object) to InspectorPanel; Phase 6 extends the existing `selectedElementType` selector to also extract the element object

### Prior Phase Context
- `.planning/phases/05-dnd-element-placement/05-CONTEXT.md` — D-04 (inspector panel swap), D-06 (canvas click deselect), D-08 (element card icons) — carry-forward patterns
- `.planning/STATE.md` — CC-2 (inline styles only, no CSS classes), CC-6 (px units in export HTML), font-medium forbidden rule

### Architecture Constraints
- `.planning/STATE.md` — CC-2: TipTap `renderHTML` uses `style=""` only (also applies to ButtonRenderer inline styles for export compatibility); CC-6: all export HTML dimensions in `px`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/client/src/components/ui/input.tsx` — shadcn Input component; use for src, alt, width, label, href fields in editors
- `apps/client/src/components/ui/button.tsx` — `size="icon-sm"` confirmed; use for segmented style toggle buttons
- `apps/client/src/components/builder/InspectorPanel.tsx` — existing header (back arrow + element name) stays unchanged; Phase 6 replaces the `<div className="p-4">` placeholder body only
- `lucide-react` — `Image`, `ImagePlus`, `ExternalLink`, `MousePointerClick` icons already used in BuilderPalette; reuse in renderers

### Established Patterns
- **Tailwind v4 JIT rule:** All class names MUST be complete string literals — no template literals
- **`font-medium` (500) is FORBIDDEN** — only `font-semibold` (600) allowed throughout Phase 6
- **Inline styles for configurable colours (CC-2/CC-6):** `backgroundColor`, `textColor`, `borderRadius` go in `style={}` prop, NOT Tailwind classes — this is critical for email export
- **Immer mutation in Zustand:** `slot.element = { ...slot.element, ...patch }` pattern for `updateElement`; use `Object.assign` or spread inside `set()` callback; do NOT `structuredClone` without `current()` first
- **`assertNeverElement` exhaustiveness:** use in the `default` case of any `switch(element.type)` in Phase 6

### Integration Points
- `ElementRenderer.tsx` → dispatches to ImageRenderer / ImageLinkRenderer / ButtonRenderer based on `element.type`; rich-text and divider fall through to a `[element.type]` stub (Phase 7 owns those)
- `InspectorPanel.tsx` body → routes to `<ImageEditor element={...} />` for `image`/`image-link`, `<ButtonEditor element={...} />` for `button`, fallback note for other types
- `BuilderPage.tsx` → extend `selectedElementType` selector to also capture the full element; pass `element={selectedElement}` to InspectorPanel
- `useNewsletterStore.ts` → add `updateElement(slotId: string, patch: Partial<ElementUnion>)` — finds slot by ID across all rows, merges patch into `slot.element`

</code_context>

<specifics>
## Specific Ideas

- **Image empty-state copy:** "Add image URL" (from discussion D-01) — exact prompt text for the placeholder.
- **Width default:** `"100%"` (from discussion D-03) — pre-populated in the width field for freshly dropped images.
- **Style toggle labels:** "Filled" and "Outline" (from discussion D-06) — display labels for the segmented button group.
- **Image crop/zoom deferred:** User mentioned wanting zoom/snip controls; noted as future enhancement (post-Phase 7), not in Phase 6 scope.

</specifics>

<deferred>
## Deferred Ideas

- **Image crop/zoom controls:** User wants the ability to zoom in/out and crop/fit the image within the slot placeholder. This is a richer interaction (object-position, crop handles, fit mode) beyond Phase 6's scope. Deferred to a post-Phase 7 enhancement.
- **`ghost` button style:** The type definition includes `'ghost'` but the Phase 6 editor only exposes Filled + Outline. Ghost can be added in Phase 6.1 or Phase 8 if needed.
- **Preset color swatches:** Using `GlobalStyles.primaryColor` as a "reset" option in color pickers — deferred, ROADMAP doesn't spec it.

</deferred>

---

*Phase: 6 — Image & Button Elements*
*Context gathered: 2026-06-08*
