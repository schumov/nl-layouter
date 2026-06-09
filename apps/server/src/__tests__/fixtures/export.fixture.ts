// apps/server/src/__tests__/fixtures/export.fixture.ts
// Shared test fixtures for Phase 9 export pipeline tests.

// Inline types — server tests are standalone, do not import from apps/client.
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

export const PARA_NODE: TiptapNode = {
  type: 'paragraph',
  content: [{ type: 'text', text: 'Hello World' }],
};

export const BOLD_NODE: TiptapNode = {
  type: 'paragraph',
  content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Bold text' }],
};

export const HEADING_NODE: TiptapNode = {
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text: 'Section Heading' }],
};

export const BULLET_LIST_NODE: TiptapNode = {
  type: 'bulletList',
  content: [
    {
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item one' }] }],
    },
    {
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item two' }] }],
    },
  ],
};

export const ALIGN_CENTER_NODE: TiptapNode = {
  type: 'paragraph',
  attrs: { textAlign: 'center' },
  content: [{ type: 'text', text: 'Centered text' }],
};

export const TIPTAP_DOC = {
  type: 'doc' as const,
  content: [PARA_NODE, BOLD_NODE, HEADING_NODE, BULLET_LIST_NODE, ALIGN_CENTER_NODE],
};

export const IMAGE_ELEMENT = {
  type: 'image' as const,
  id: 'img-1',
  src: 'https://example.com/image.jpg',
  alt: 'Test image',
  width: '300px',
};

export const IMAGE_LINK_ELEMENT = {
  type: 'image-link' as const,
  id: 'imglink-1',
  src: 'https://example.com/image.jpg',
  alt: 'Linked image',
  href: 'https://example.com',
  width: '300px',
};

export const BUTTON_ELEMENT = {
  type: 'button' as const,
  id: 'btn-1',
  label: 'Click Me',
  href: 'https://example.com',
  backgroundColor: '#0066cc',
  textColor: '#ffffff',
  borderRadius: '4px',
  style: 'solid' as const,
};

export const RICH_TEXT_ELEMENT = {
  type: 'rich-text' as const,
  id: 'rt-1',
  content: TIPTAP_DOC,
  textStyle: 'body' as const,
};

export const DIVIDER_ELEMENT = {
  type: 'divider' as const,
  id: 'div-1',
  color: '#cccccc',
  spacing: 16,
  thickness: 1,
};

export const FIXTURE_DOC = {
  header: { presetId: 'header-minimal-logo', variables: {} },
  footer: { presetId: 'footer-simple-links', variables: {} },
  rows: [
    {
      id: 'row-1',
      layoutType: '1col' as const,
      slots: [{ id: 'slot-1', element: RICH_TEXT_ELEMENT }],
    },
    {
      id: 'row-2',
      layoutType: '2col' as const,
      slots: [
        { id: 'slot-2', element: IMAGE_ELEMENT },
        { id: 'slot-3', element: BUTTON_ELEMENT },
      ],
    },
  ],
  globalStyles: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    contentWidth: 600,
    primaryColor: '#0066cc',
  },
  preHeader: 'This is the hidden pre-header preview text.',
};

export const FIXTURE_HEADER_HTML =
  '<table width="600"><tr><td><img src="logo.png" /></td></tr></table>';
export const FIXTURE_FOOTER_HTML =
  '<table width="600"><tr><td><p>Unsubscribe</p></td></tr></table>';
