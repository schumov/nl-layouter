// apps/server/src/export/documentToEmailTree.tsx
// Assembles the full react-email React tree from a NewsletterDoc.
// Also exports renderDocumentToHtml() which renders the tree to an HTML string.
//
// Architecture:
//   documentToEmailTree(doc, headerHtml, footerHtml) → React.ReactElement
//     └── <EmailDocument doc>
//           ├── <div dangerouslySetInnerHTML={headerHtml} />   (EXPORT-05)
//           ├── {doc.rows.map(row => <EmailRow row globalStyles />)}
//           └── <div dangerouslySetInnerHTML={footerHtml} />   (EXPORT-05)
//
// EmailRow handles per-row layout:
//   1col  → single <table><tr><td> (no MSO needed)
//   2col+ → MSO conditional comment wrappers injected via dangerouslySetInnerHTML (EXPORT-04)
//
// Element slots dispatch to HTML-string renderers via dangerouslySetInnerHTML.

import React from 'react';
import { render } from '@react-email/render';
import { EmailDocument } from './EmailDocument.js';
import {
  imageToEmailHtml,
  imageLinkToEmailHtml,
  buttonToEmailHtml,
  richTextToEmailHtml,
  dividerToEmailHtml,
} from './elementRenderers.js';

// ── Type mirrors (from apps/client/src/types/newsletter.ts) ──────────────────

type LayoutType =
  | '1col'
  | '2col'
  | '3col'
  | 'small-left-big-right'
  | 'big-left-small-right';

interface ImageElement   { type: 'image';      id: string; src: string; alt: string; width?: string; }
interface ImageLinkElement { type: 'image-link'; id: string; src: string; alt: string; href: string; width?: string; }
interface ButtonElement  { type: 'button';     id: string; label: string; href: string; backgroundColor: string; textColor: string; borderRadius?: string; style: 'solid'|'outline'|'ghost'; }
interface RichTextElement { type: 'rich-text'; id: string; content: { type: 'doc'; content: unknown[] }; textStyle: 'header'|'subheader'|'body'|'code'; }
interface DividerElement { type: 'divider';   id: string; color: string; spacing: number; thickness: number; }
type ElementUnion = ImageElement | ImageLinkElement | ButtonElement | RichTextElement | DividerElement;

interface ColumnSlot { id: string; element: ElementUnion | null; }
interface Section {
  id: string;
  layoutType: LayoutType;
  slots: ColumnSlot[];
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
}
interface GlobalStyles {
  fontFamily: string;
  backgroundColor: string;
  contentWidth: number;
  primaryColor: string;
}
export interface NewsletterDoc {
  header: { presetId: string; variables: Record<string, string> };
  footer: { presetId: string; variables: Record<string, string> };
  rows: Section[];
  globalStyles: GlobalStyles;
  preHeader?: string;
}

// ── Column width map ──────────────────────────────────────────────────────────
// Integer px values for 600px content width.

const COLUMN_WIDTHS: Record<LayoutType, number[]> = {
  '1col':                 [600],
  '2col':                 [300, 300],
  '3col':                 [200, 200, 200],
  'small-left-big-right': [198, 396],
  'big-left-small-right': [396, 198],
};

// ── Element dispatcher → HTML string ─────────────────────────────────────────

function elementToHtml(el: ElementUnion | null): string {
  if (!el) return '';
  switch (el.type) {
    case 'image':      return imageToEmailHtml(el);
    case 'image-link': return imageLinkToEmailHtml(el);
    case 'button':     return buttonToEmailHtml(el);
    case 'rich-text':  return richTextToEmailHtml(el);
    case 'divider':    return dividerToEmailHtml(el);
    default:
      return '';
  }
}

// ── EmailRow component ────────────────────────────────────────────────────────

interface EmailRowProps {
  row: Section;
  contentWidth: number;
}

function EmailRow({ row, contentWidth }: EmailRowProps) {
  const widths = COLUMN_WIDTHS[row.layoutType] ?? [contentWidth];
  const isMultiCol = widths.length > 1;

  const rowStyle: React.CSSProperties = {
    backgroundColor: row.backgroundColor ?? undefined,
    paddingTop:      row.paddingTop    != null ? `${row.paddingTop}px`    : undefined,
    paddingBottom:   row.paddingBottom != null ? `${row.paddingBottom}px` : undefined,
  };

  if (!isMultiCol) {
    const slot = row.slots[0];
    const elHtml = slot ? elementToHtml(slot.element) : '';
    return (
      <table
        role="presentation"
        width={contentWidth}
        style={{ ...rowStyle, borderCollapse: 'collapse', width: `${contentWidth}px` }}
      >
        <tbody>
          <tr>
            <td width={contentWidth} valign="top" style={{ padding: '0', verticalAlign: 'top' }}>
              <div dangerouslySetInnerHTML={{ __html: elHtml }} />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // Multi-column layout with MSO conditional comment wrappers (EXPORT-04).
  // React strips HTML comments from JSX, so inject them via dangerouslySetInnerHTML.
  const slots = row.slots.slice(0, widths.length);
  const msoTableOpen  = `<!--[if mso]><table role="presentation" width="${contentWidth}" style="border-collapse:collapse"><tr><!--<![endif]-->`;
  const msoTableClose = `<!--[if mso]></tr></table><![endif]-->`;
  const msoColOpen    = (w: number) =>
    `<!--[if mso]><td width="${w}" valign="top" style="padding:0"><!--<![endif]-->`;
  const msoColClose   = `<!--[if mso]></td><!--<![endif]-->`;

  return (
    <table
      role="presentation"
      width={contentWidth}
      style={{ ...rowStyle, borderCollapse: 'collapse', width: `${contentWidth}px` }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '0' }}>
            <div dangerouslySetInnerHTML={{ __html: msoTableOpen }} />
            {slots.map((slot, idx) => {
              const w = widths[idx] ?? widths[0] ?? 300;
              const elHtml = elementToHtml(slot?.element ?? null);
              return (
                <React.Fragment key={slot?.id ?? idx}>
                  <div dangerouslySetInnerHTML={{ __html: msoColOpen(w) }} />
                  <div
                    style={{
                      display:     'inline-block',
                      width:       `${w}px`,
                      maxWidth:    `${w}px`,
                      verticalAlign: 'top',
                    }}
                  >
                    <table
                      role="presentation"
                      width={w}
                      style={{ borderCollapse: 'collapse', width: `${w}px` }}
                    >
                      <tbody>
                        <tr>
                          <td valign="top" style={{ padding: '0', verticalAlign: 'top' }}>
                            <div dangerouslySetInnerHTML={{ __html: elHtml }} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: msoColClose }} />
                </React.Fragment>
              );
            })}
            <div dangerouslySetInnerHTML={{ __html: msoTableClose }} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build the full react-email React tree from a newsletter document.
 * Pass the result to @react-email/render's render() or to renderDocumentToHtml().
 */
export function documentToEmailTree(
  doc: NewsletterDoc,
  headerHtml: string,
  footerHtml: string,
): React.ReactElement {
  const contentWidth = doc.globalStyles?.contentWidth ?? 600;
  return (
    <EmailDocument doc={doc}>
      {headerHtml && <div dangerouslySetInnerHTML={{ __html: headerHtml }} />}
      {(doc.rows ?? []).map((row) => (
        <EmailRow key={row.id} row={row} contentWidth={contentWidth} />
      ))}
      {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}
    </EmailDocument>
  );
}

/**
 * Render a newsletter document to a raw HTML string (before juice + doctype).
 * Used by documentToEmailTree tests and by pipeline.ts.
 */
export async function renderDocumentToHtml(
  doc: NewsletterDoc,
  headerHtml: string,
  footerHtml: string,
): Promise<string> {
  const tree = documentToEmailTree(doc, headerHtml, footerHtml);
  return render(tree, { pretty: false });
}
