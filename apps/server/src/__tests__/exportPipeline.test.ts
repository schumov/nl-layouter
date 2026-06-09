// apps/server/src/__tests__/exportPipeline.test.ts
// RED stubs — Plan 09-00. Implementation in Plans 09-04 + 09-05.
import { describe, it, expect } from 'vitest';
import { renderToEmailHtml } from '../export/pipeline.js';
import {
  FIXTURE_DOC,
  FIXTURE_HEADER_HTML,
  FIXTURE_FOOTER_HTML,
} from './fixtures/export.fixture.js';

describe('exportPipeline', () => {
  it('PIPELINE-01: output contains no display:flex or display:grid', async () => {
    const html = await renderToEmailHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    expect(html).not.toMatch(/display\s*:\s*flex/i);
    expect(html).not.toMatch(/display\s*:\s*grid/i);
  });

  it('PIPELINE-02: output contains no <style> blocks after juice inlining', async () => {
    const html = await renderToEmailHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    expect(html).not.toMatch(/<style[\s>]/i);
  });

  it('PIPELINE-03: multi-column rows have MSO conditional comments', async () => {
    const html = await renderToEmailHtml(FIXTURE_DOC, FIXTURE_HEADER_HTML, FIXTURE_FOOTER_HTML);
    // FIXTURE_DOC has a 2col row — must have MSO conditional comment
    expect(html).toContain('[if mso]');
  });
});
