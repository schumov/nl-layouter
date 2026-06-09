// apps/server/src/__tests__/elementRenderers.test.ts
// RED stubs — Plan 09-00. Implementation in Plan 09-02.
import { describe, it, expect } from 'vitest';
import {
  imageToEmailHtml,
  imageLinkToEmailHtml,
  buttonToEmailHtml,
  richTextToEmailHtml,
  dividerToEmailHtml,
} from '../export/elementRenderers.js';
import {
  IMAGE_ELEMENT,
  IMAGE_LINK_ELEMENT,
  BUTTON_ELEMENT,
  RICH_TEXT_ELEMENT,
  DIVIDER_ELEMENT,
} from './fixtures/export.fixture.js';

describe('elementRenderers', () => {
  it('ELEM-RENDER-01: imageToEmailHtml renders <img> with width, height, and max-width style', () => {
    const html = imageToEmailHtml(IMAGE_ELEMENT);
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/image.jpg"');
    expect(html).toContain('alt="Test image"');
    expect(html).toContain('max-width');
  });

  it('ELEM-RENDER-02: imageLinkToEmailHtml wraps image in <a> with href', () => {
    const html = imageLinkToEmailHtml(IMAGE_LINK_ELEMENT);
    expect(html).toContain('<a ');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<img');
  });

  it('ELEM-RENDER-03: buttonToEmailHtml renders <a> with background-color and text color', () => {
    const html = buttonToEmailHtml(BUTTON_ELEMENT);
    expect(html).toContain('<a ');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('background-color');
    expect(html).toContain('Click Me');
  });

  it('ELEM-RENDER-04: richTextToEmailHtml renders TipTap content as HTML', () => {
    const html = richTextToEmailHtml(RICH_TEXT_ELEMENT);
    expect(html).toContain('Hello World');
    expect(html).toContain('<p');
  });

  it('ELEM-RENDER-05: dividerToEmailHtml renders <hr> with correct border style', () => {
    const html = dividerToEmailHtml(DIVIDER_ELEMENT);
    expect(html).toContain('<hr');
    expect(html).toContain('#cccccc');
  });
});
