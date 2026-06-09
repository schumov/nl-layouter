// apps/server/src/__tests__/documentToEmailTree.test.ts
// RED stubs — Plan 09-00. Implementation in Plan 09-03.
import { describe, it, expect } from 'vitest';
import { renderDocumentToHtml } from '../export/documentToEmailTree.js';
import {
  FIXTURE_DOC,
  FIXTURE_HEADER_HTML,
  FIXTURE_FOOTER_HTML,
} from './fixtures/export.fixture.js';

describe('documentToEmailTree', () => {
  it('DOCTREE-01: output contains header HTML', async () => {
    const html = await renderDocumentToHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    expect(html).toContain('logo.png');
  });

  it('DOCTREE-02: output contains footer HTML', async () => {
    const html = await renderDocumentToHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    expect(html).toContain('Unsubscribe');
  });

  it('DOCTREE-03: output contains pre-header hidden span', async () => {
    const html = await renderDocumentToHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    expect(html).toContain('pre-header preview text');
    // The span must be hidden
    expect(html).toContain('display');
    expect(html).toContain('none');
  });
});
