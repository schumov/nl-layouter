// apps/server/src/export/pipeline.ts
// Full HTML export pipeline orchestrator for Phase 9.
//
// Pipeline steps:
//   1. documentToEmailTree(doc, headerHtml, footerHtml) → React.ReactElement
//   2. render(tree)          → raw HTML string (react-email)
//   3. juice(html)           → CSS inlined, <style> blocks removed
//   4. wrapWithDoctype(html) → XHTML DOCTYPE + VML namespaces + MSO head
//
// EXPORT-02: table-based layout (no flex/grid) — guaranteed by documentToEmailTree
// EXPORT-03: all CSS inlined — juice removes <style> blocks
// EXPORT-04: MSO conditional comments — injected by documentToEmailTree EmailRow
// EXPORT-06: pre-header span — injected by EmailDocument

import { render } from '@react-email/render';
import juice from 'juice';
import { documentToEmailTree, type NewsletterDoc } from './documentToEmailTree.js';
import { wrapWithDoctype } from './doctype.js';

/**
 * Run the full HTML export pipeline for a newsletter document.
 *
 * @param doc        Full NewsletterDoc from DB (already typed as Record<string,unknown> in DB layer)
 * @param headerHtml Raw HTML string from the header preset (empty string if none)
 * @param footerHtml Raw HTML string from the footer preset (empty string if none)
 * @returns          Final export-ready HTML string
 */
export async function renderToEmailHtml(
  doc: NewsletterDoc,
  headerHtml: string,
  footerHtml: string,
): Promise<string> {
  // Step 1: Build react-email component tree
  const tree = documentToEmailTree(doc, headerHtml, footerHtml);

  // Step 2: Server-side render to HTML string
  const rawHtml = await render(tree, { pretty: false });

  // Step 3: Inline all CSS + remove <style> blocks
  const inlined = juice(rawHtml, {
    removeStyleTags: true,
    preserveMediaQueries: false,
    applyAttributesTableElements: false,
  });

  // Step 4: Prepend XHTML DOCTYPE + add VML namespaces + MSO head block
  return wrapWithDoctype(inlined);
}
