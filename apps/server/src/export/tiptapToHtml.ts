// apps/server/src/export/tiptapToHtml.ts
// Bespoke TipTap JSON → HTML converter for server-side email export.
//
// Converts TipTap's JSON format (produced by Phase 7 extensions) to inline-styled HTML
// suitable for email clients. No TipTap/ProseMirror dependencies — pure recursive converter.
//
// Handles the node types produced by StarterKit + TextStyleKit + TextAlign:
//   Blocks: doc, paragraph, heading, bulletList, orderedList, listItem, hardBreak
//   Marks:  bold, italic, underline, link, textStyle (color, fontSize, fontFamily)
//   Attrs:  textAlign on paragraph/heading nodes
//
// The output is wrapped in a <div> with preset typography styles (PRESET_STYLES).

// ── Types (mirrored from apps/client/src/types/newsletter.ts) ─────────────────

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

interface TiptapJSONDoc {
  type: 'doc';
  content: TiptapNode[];
}

type TextStyle = 'header' | 'subheader' | 'body' | 'code';

// ── Typography preset map (matches RichTextStaticRenderer.tsx on client) ──────

const PRESET_STYLES: Record<TextStyle, string> = {
  header:    'font-size:28px;font-weight:700;line-height:1.2',
  subheader: 'font-size:20px;font-weight:600;line-height:1.3',
  body:      'font-size:16px;font-weight:400;line-height:1.6',
  code:      'font-size:14px;font-family:monospace;line-height:1.5',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function blockStyle(attrs?: Record<string, unknown>): string {
  const textAlign = attrs?.textAlign as string | undefined;
  return textAlign && textAlign !== 'left' ? ` style="text-align:${textAlign}"` : '';
}

// ── Node renderers ─────────────────────────────────────────────────────────────

function renderNode(node: TiptapNode): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(renderNode).join('');

    case 'paragraph': {
      const inner = (node.content ?? []).map(renderNode).join('');
      return `<p${blockStyle(node.attrs)}>${inner}</p>`;
    }

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      const inner = (node.content ?? []).map(renderNode).join('');
      return `<${tag}${blockStyle(node.attrs)}>${inner}</${tag}>`;
    }

    case 'bulletList': {
      const items = (node.content ?? []).map(renderNode).join('');
      return `<ul style="padding-left:1.5em;margin:0.5em 0">${items}</ul>`;
    }

    case 'orderedList': {
      const items = (node.content ?? []).map(renderNode).join('');
      return `<ol style="padding-left:1.5em;margin:0.5em 0">${items}</ol>`;
    }

    case 'listItem': {
      const inner = (node.content ?? []).map(renderNode).join('');
      // Strip wrapping <p> tags from listItem paragraphs (inline content only)
      const stripped = inner.replace(/^<p[^>]*>(.*)<\/p>$/s, '$1');
      return `<li>${stripped}</li>`;
    }

    case 'hardBreak':
      return '<br/>';

    case 'text':
      return renderTextNode(node);

    default:
      // Unknown nodes: render children or empty string
      return (node.content ?? []).map(renderNode).join('');
  }
}

function renderTextNode(node: TiptapNode): string {
  let html = escapeHtml(node.text ?? '');
  const marks = node.marks ?? [];

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        html = `<strong>${html}</strong>`;
        break;
      case 'italic':
        html = `<em>${html}</em>`;
        break;
      case 'underline':
        html = `<u style="text-decoration:underline">${html}</u>`;
        break;
      case 'link': {
        const href = escapeHtml((mark.attrs?.href as string) ?? '#');
        const target = mark.attrs?.target as string | undefined;
        const targetAttr = target ? ` target="${escapeHtml(target)}"` : '';
        html = `<a href="${href}"${targetAttr} style="color:inherit">${html}</a>`;
        break;
      }
      case 'textStyle': {
        const parts: string[] = [];
        if (mark.attrs?.color) parts.push(`color:${mark.attrs.color as string}`);
        if (mark.attrs?.fontSize) parts.push(`font-size:${mark.attrs.fontSize as string}`);
        if (mark.attrs?.fontFamily) parts.push(`font-family:${mark.attrs.fontFamily as string}`);
        if (parts.length > 0) {
          html = `<span style="${parts.join(';')}">${html}</span>`;
        }
        break;
      }
      default:
        break;
    }
  }

  return html;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Convert a TipTap JSON document to an inline-styled HTML string.
 *
 * @param doc       TipTap { type: 'doc', content: [...] } or compatible structure
 * @param textStyle Typography preset — wraps output in preset styles
 * @returns         HTML string ready for email embedding
 */
export function tiptapToHtml(doc: TiptapJSONDoc | { type: string; content: TiptapNode[] }, textStyle: TextStyle = 'body'): string {
  const presetCss = PRESET_STYLES[textStyle];
  const inner = renderNode(doc as TiptapNode);
  return `<div style="${presetCss}">${inner}</div>`;
}
