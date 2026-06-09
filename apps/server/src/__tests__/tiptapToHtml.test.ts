// apps/server/src/__tests__/tiptapToHtml.test.ts
// RED stubs — Plan 09-00. Implementation in Plan 09-02.
import { describe, it, expect } from 'vitest';
import { tiptapToHtml } from '../export/tiptapToHtml.js';
import {
  PARA_NODE,
  BOLD_NODE,
  HEADING_NODE,
  BULLET_LIST_NODE,
  ALIGN_CENTER_NODE,
} from './fixtures/export.fixture.js';

describe('tiptapToHtml', () => {
  it('TIPTAP-01: renders paragraph node as <p> tag', () => {
    const result = tiptapToHtml({ type: 'doc', content: [PARA_NODE] }, 'body');
    expect(result).toContain('<p');
    expect(result).toContain('Hello World');
  });

  it('TIPTAP-02: renders bold mark as <strong>', () => {
    const result = tiptapToHtml({ type: 'doc', content: [BOLD_NODE] }, 'body');
    expect(result).toContain('<strong>');
    expect(result).toContain('Bold text');
  });

  it('TIPTAP-03: renders heading node as <h2>', () => {
    const result = tiptapToHtml({ type: 'doc', content: [HEADING_NODE] }, 'body');
    expect(result).toContain('<h2');
    expect(result).toContain('Section Heading');
  });

  it('TIPTAP-04: renders bulletList as <ul> with <li> items', () => {
    const result = tiptapToHtml({ type: 'doc', content: [BULLET_LIST_NODE] }, 'body');
    expect(result).toContain('<ul');
    expect(result).toContain('<li');
    expect(result).toContain('Item one');
    expect(result).toContain('Item two');
  });

  it('TIPTAP-05: renders textAlign:center as style="text-align:center"', () => {
    const result = tiptapToHtml({ type: 'doc', content: [ALIGN_CENTER_NODE] }, 'body');
    expect(result).toContain('text-align:center');
    expect(result).toContain('Centered text');
  });
});
