import { describe, it, expectTypeOf } from 'vitest';
import type {
  ElementUnion,
  NewsletterDoc,
  DividerElement,
  Section,
  ColumnSlot,
} from '../newsletter';

describe('NewsletterDoc type coverage', () => {
  it('ElementUnion covers all 5 element types', () => {
    const el: ElementUnion = {
      type: 'divider',
      id: 'test-id',
      color: '#cccccc',
      spacing: 8,
      thickness: 1,
    };
    expectTypeOf(el).toMatchTypeOf<ElementUnion>();
  });

  it('DividerElement is part of ElementUnion — not never', () => {
    expectTypeOf<Extract<ElementUnion, { type: 'divider' }>>().not.toBeNever();
  });

  it('switch on element.type is exhaustive with 5 cases', () => {
    function assertNever(x: never): never {
      throw new Error(`Unhandled element type: ${String(x)}`);
    }
    function render(el: ElementUnion): string {
      switch (el.type) {
        case 'image':      return el.src;
        case 'image-link': return el.href;
        case 'button':     return el.label;
        case 'rich-text':  return 'rich-text';
        case 'divider':    return 'divider';
        default:           return assertNever(el); // TypeScript error here = missing case
      }
    }
    expectTypeOf(render).toBeFunction();
  });

  it('NewsletterDoc has rows typed as Section[]', () => {
    expectTypeOf<NewsletterDoc['rows']>().toEqualTypeOf<Section[]>();
  });

  it('Section.slots is ColumnSlot[]', () => {
    expectTypeOf<Section['slots']>().toEqualTypeOf<ColumnSlot[]>();
  });

  it('ColumnSlot.element allows null', () => {
    expectTypeOf<ColumnSlot['element']>().toEqualTypeOf<ElementUnion | null>();
  });

  it('DividerElement has color, spacing, thickness fields', () => {
    expectTypeOf<DividerElement['color']>().toEqualTypeOf<string>();
    expectTypeOf<DividerElement['spacing']>().toEqualTypeOf<number>();
    expectTypeOf<DividerElement['thickness']>().toEqualTypeOf<number>();
  });
});
