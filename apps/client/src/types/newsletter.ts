// apps/client/src/types/newsletter.ts
// THE CANONICAL DATA MODEL — do not rename or restructure without updating all imports.
// Phase 1 establishes this type system; all phases 2-9 build on top of it.

// ─── Layout types ────────────────────────────────────────────────────────────

export type LayoutType =
  | '1col'
  | '2col'
  | '3col'
  | 'small-left-big-right'   // 33% / 67% split
  | 'big-left-small-right';  // 67% / 33% split

// ─── Element types (discriminated union on `type`) ───────────────────────────
// REQUIREMENTS: ELEM-01 (image), ELEM-03 (image-link), ELEM-04 (button),
//               ELEM-06 (rich-text), ELEM-09 (divider) = 5 types total.
// WARNING: Do not remove DividerElement — Phase 7 depends on it being here.

export interface ImageElement {
  type: 'image';
  id: string;
  src: string;
  alt: string;
  width?: string;             // e.g. "100%" or "300px"
}

export interface ImageLinkElement {
  type: 'image-link';
  id: string;
  src: string;
  alt: string;
  href: string;
  width?: string;
}

export interface ButtonElement {
  type: 'button';
  id: string;
  label: string;
  href: string;
  backgroundColor: string;   // hex e.g. "#0066cc"
  textColor: string;         // hex e.g. "#ffffff"
  borderRadius?: string;     // e.g. "4px"
  style: 'solid' | 'outline' | 'ghost';
}

export interface RichTextElement {
  type: 'rich-text';
  id: string;
  content: TiptapJSONDoc;    // TipTap JSONContent: { type: 'doc', content: [...] }
  textStyle: 'header' | 'subheader' | 'body' | 'code';
}

// DividerElement — REQUIRED (ELEM-09). Not in ARCHITECTURE.md but IS in REQUIREMENTS.md.
// Phase 7 will render this as a configurable <hr> with inline styles.
export interface DividerElement {
  type: 'divider';
  id: string;
  color: string;             // hex e.g. "#cccccc"
  spacing: number;           // vertical padding above + below in px
  thickness: number;         // hr height in px (e.g. 1)
}

// The discriminated union — exhaustive switch on `type` always works
// when all 5 cases + assertNever default are present
export type ElementUnion =
  | ImageElement
  | ImageLinkElement
  | ButtonElement
  | RichTextElement
  | DividerElement;

// ─── TipTap JSON document structure ─────────────────────────────────────────

export interface TiptapJSONDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

// ─── Canvas structure ────────────────────────────────────────────────────────

export interface ColumnSlot {
  id: string;
  element: ElementUnion | null;   // null = empty/droppable slot
}

export interface Section {
  id: string;                     // UUID — stable DnD key (must be unique)
  layoutType: LayoutType;
  slots: ColumnSlot[];            // length MUST match layoutType column count
  backgroundColor?: string;       // hex or undefined
  paddingTop?: number;            // px
  paddingBottom?: number;         // px
}

// ─── Header / Footer preset config ──────────────────────────────────────────

export interface HeaderConfig {
  presetId: string;               // e.g. "header-minimal" — seeded in Phase 8
  variables: Record<string, string>;
}

export interface FooterConfig {
  presetId: string;               // e.g. "footer-legal" — seeded in Phase 8
  variables: Record<string, string>;
}

// ─── Global document styles ──────────────────────────────────────────────────

export interface GlobalStyles {
  fontFamily: string;             // e.g. "Arial, sans-serif"
  backgroundColor: string;       // e.g. "#f4f4f4"
  contentWidth: number;          // px — standard email width is 600
  primaryColor: string;          // e.g. "#0066cc"
}

// ─── Top-level document ──────────────────────────────────────────────────────
// Stored as JSONB in PostgreSQL. Always read/written atomically.
// NEVER serialize to HTML before storing — HTML cannot be re-parsed to canvas state.

export interface NewsletterDoc {
  header: HeaderConfig;
  rows: Section[];               // The canvas sections, in display order
  footer: FooterConfig;
  globalStyles: GlobalStyles;
}

// ─── Type guard functions ────────────────────────────────────────────────────
// Use these in switch fallthrough and conditional rendering.

export const isImageElement = (el: ElementUnion): el is ImageElement =>
  el.type === 'image';

export const isImageLinkElement = (el: ElementUnion): el is ImageLinkElement =>
  el.type === 'image-link';

export const isButtonElement = (el: ElementUnion): el is ButtonElement =>
  el.type === 'button';

export const isRichTextElement = (el: ElementUnion): el is RichTextElement =>
  el.type === 'rich-text';

export const isDividerElement = (el: ElementUnion): el is DividerElement =>
  el.type === 'divider';

// ─── Exhaustive switch helper ────────────────────────────────────────────────
// Import and call in the `default` case of any switch on ElementUnion.type.
// TypeScript will error at compile time if any element type is unhandled.

export function assertNeverElement(x: never): never {
  throw new Error(`Unhandled element type: ${String(x)}`);
}
