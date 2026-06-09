// apps/server/src/export/elementRenderers.tsx
// Per-element HTML renderers for the Phase 9 email export pipeline.
//
// Each function accepts a typed element object and returns an HTML string
// suitable for embedding in an email (table-based, inline styles, px units only).
//
// EXPORT-02: No display:flex or display:grid
// EXPORT-03: All CSS inline (juice will inline any remaining class-based styles)
// CC-6: All dimensions in px — no rem/em/vh (Outlook Word engine doesn't support them)

import { tiptapToHtml } from './tiptapToHtml.js';

// ── Local types (mirror apps/client/src/types/newsletter.ts) ─────────────────

interface ImageElement {
  type: 'image';
  id: string;
  src: string;
  alt: string;
  width?: string;
}

interface ImageLinkElement {
  type: 'image-link';
  id: string;
  src: string;
  alt: string;
  href: string;
  width?: string;
}

interface ButtonElement {
  type: 'button';
  id: string;
  label: string;
  href: string;
  backgroundColor: string;
  textColor: string;
  borderRadius?: string;
  style: 'solid' | 'outline' | 'ghost';
}

interface TiptapJSONDoc {
  type: 'doc';
  content: unknown[];
}

interface RichTextElement {
  type: 'rich-text';
  id: string;
  content: TiptapJSONDoc;
  textStyle: 'header' | 'subheader' | 'body' | 'code';
}

interface DividerElement {
  type: 'divider';
  id: string;
  color: string;
  spacing: number;
  thickness: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Parse a CSS width string → pixel integer. Falls back to 600 for percentages. */
function parseWidthPx(width: string | undefined, containerWidth = 600): number {
  if (!width) return containerWidth;
  if (width.endsWith('px')) return parseInt(width, 10);
  if (width.endsWith('%')) {
    const pct = parseFloat(width) / 100;
    return Math.round(pct * containerWidth);
  }
  return containerWidth;
}

// ── Element renderers ─────────────────────────────────────────────────────────

/**
 * Render an ImageElement as an email-safe <img> tag.
 * EXPORT-02: uses width/height HTML attributes + max-width inline style.
 */
export function imageToEmailHtml(el: ImageElement): string {
  const w = parseWidthPx(el.width);
  return (
    `<img src="${el.src}" alt="${el.alt}" ` +
    `width="${w}" ` +
    `style="display:block;max-width:100%;height:auto;border:0" />`
  );
}

/**
 * Render an ImageLinkElement as a linked image.
 */
export function imageLinkToEmailHtml(el: ImageLinkElement): string {
  const w = parseWidthPx(el.width);
  return (
    `<a href="${el.href}" style="display:block;text-decoration:none">` +
    `<img src="${el.src}" alt="${el.alt}" ` +
    `width="${w}" ` +
    `style="display:block;max-width:100%;height:auto;border:0" />` +
    `</a>`
  );
}

/**
 * Render a ButtonElement as an email-safe <a> button.
 * Uses table-based centering so Outlook renders it correctly.
 */
export function buttonToEmailHtml(el: ButtonElement): string {
  const borderRadius = el.borderRadius ?? '4px';

  let bgColor: string;
  let textColor: string;
  let border: string;

  switch (el.style) {
    case 'solid':
      bgColor   = el.backgroundColor;
      textColor = el.textColor;
      border    = `2px solid ${el.backgroundColor}`;
      break;
    case 'outline':
      bgColor   = 'transparent';
      textColor = el.backgroundColor;
      border    = `2px solid ${el.backgroundColor}`;
      break;
    case 'ghost':
      bgColor   = 'transparent';
      textColor = el.backgroundColor;
      border    = 'none';
      break;
  }

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    `<tr><td align="center" style="border-radius:${borderRadius};background-color:${bgColor};border:${border}">` +
    `<a href="${el.href}" ` +
    `style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:600;` +
    `color:${textColor};background-color:${bgColor};text-decoration:none;` +
    `border-radius:${borderRadius};border:${border}">` +
    `${el.label}` +
    `</a></td></tr></table>`
  );
}

/**
 * Render a RichTextElement — converts TipTap JSON to inline-styled HTML.
 */
export function richTextToEmailHtml(el: RichTextElement): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tiptapToHtml(el.content as any, el.textStyle);
}

/**
 * Render a DividerElement as an email-safe <hr>.
 */
export function dividerToEmailHtml(el: DividerElement): string {
  return (
    `<hr style="display:block;border:none;border-top:${el.thickness}px solid ${el.color};` +
    `margin:${el.spacing}px 0;padding:0" />`
  );
}
