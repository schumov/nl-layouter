import { describe, it, expect, beforeEach } from 'vitest';
import { useNewsletterStore } from '../useNewsletterStore';
import { FIXTURE_DOC } from '../../fixtures/newsletter.fixture';
import type { Section } from '../../types/newsletter';

beforeEach(() => {
  useNewsletterStore.setState({
    doc: structuredClone(FIXTURE_DOC),
    selectedElementId: null,
  });
});

describe('useNewsletterStore — section mutations', () => {
  it('CANVAS-03: addSection appends section at the bottom of doc.rows', () => {
    const { addSection } = useNewsletterStore.getState();
    const newSection: Section = {
      id: 'new-section-id',
      layoutType: '1col',
      slots: [{ id: 'new-slot-id', element: null }],
    };
    addSection(newSection);
    const rows = useNewsletterStore.getState().doc!.rows;
    expect(rows).toHaveLength(FIXTURE_DOC.rows.length + 1);
    expect(rows[rows.length - 1].id).toBe('new-section-id');
  });

  it('CANVAS-05: removeSection removes section by ID', () => {
    const { removeSection } = useNewsletterStore.getState();
    const targetId = FIXTURE_DOC.rows[0].id;
    removeSection(targetId);
    const rows = useNewsletterStore.getState().doc!.rows;
    expect(rows).toHaveLength(FIXTURE_DOC.rows.length - 1);
    expect(rows.find((r) => r.id === targetId)).toBeUndefined();
  });

  it('CANVAS-04: reorderSections moves row to new index', () => {
    const { reorderSections } = useNewsletterStore.getState();
    const originalIds = useNewsletterStore.getState().doc!.rows.map((r) => r.id);
    reorderSections(originalIds[0], originalIds[2]);
    const newIds = useNewsletterStore.getState().doc!.rows.map((r) => r.id);
    expect(newIds[0]).toBe(originalIds[1]);
    expect(newIds[1]).toBe(originalIds[2]);
    expect(newIds[2]).toBe(originalIds[0]);
  });

  it('CANVAS-04: reorderSections is a no-op when activeId === overId', () => {
    const { reorderSections } = useNewsletterStore.getState();
    const id = FIXTURE_DOC.rows[0].id;
    reorderSections(id, id);
    const rows = useNewsletterStore.getState().doc!.rows;
    expect(rows.map((r) => r.id)).toEqual(FIXTURE_DOC.rows.map((r) => r.id));
  });

  it('CANVAS-06: duplicateSection inserts clone after original with new IDs', () => {
    const { duplicateSection } = useNewsletterStore.getState();
    const targetId = FIXTURE_DOC.rows[1].id;
    duplicateSection(targetId);
    const rows = useNewsletterStore.getState().doc!.rows;
    expect(rows).toHaveLength(FIXTURE_DOC.rows.length + 1);
    const clone = rows[2];
    expect(clone.id).not.toBe(targetId);
    expect(clone.layoutType).toBe(FIXTURE_DOC.rows[1].layoutType);
    clone.slots.forEach((slot, i) => {
      expect(slot.id).not.toBe(FIXTURE_DOC.rows[1].slots[i].id);
    });
  });

  it('CANVAS-06: duplicateSection is a no-op for unknown sectionId', () => {
    useNewsletterStore.getState().duplicateSection('unknown-id');
    expect(useNewsletterStore.getState().doc!.rows).toHaveLength(FIXTURE_DOC.rows.length);
  });
});

describe('useNewsletterStore — element mutations (Phase 5 RED stubs)', () => {
  it('ELEM-10: addElement creates element with given type in the matching slot', () => {
    // RED: addElement does not exist yet — TypeError: addElement is not a function
    const { addElement } = useNewsletterStore.getState() as any;
    addElement('fixture-slot-1col-1', 'image');
    const slot = useNewsletterStore.getState().doc!.rows[0].slots[0];
    expect(slot.element).not.toBeNull();
    expect(slot.element?.type).toBe('image');
  });

  it('ELEM-11: addElement on occupied slot overwrites existing element (replace)', () => {
    // RED: addElement does not exist yet
    const { addElement } = useNewsletterStore.getState() as any;
    addElement('fixture-slot-1col-1', 'image');
    addElement('fixture-slot-1col-1', 'button');
    const slot = useNewsletterStore.getState().doc!.rows[0].slots[0];
    expect(slot.element?.type).toBe('button');
  });

  it('ELEM-10: addElement creates element with a non-null id string', () => {
    // RED: addElement does not exist yet
    const { addElement } = useNewsletterStore.getState() as any;
    addElement('fixture-slot-2col-1', 'divider');
    const slot = useNewsletterStore.getState().doc!.rows[1].slots[0];
    expect(typeof slot.element?.id).toBe('string');
    expect(slot.element!.id.length).toBeGreaterThan(0);
  });

  it('ELEM-12: removeElement sets slot.element to null', () => {
    // RED: removeElement does not exist yet — TypeError: removeElement is not a function
    const { addElement, removeElement } = useNewsletterStore.getState() as any;
    addElement('fixture-slot-1col-1', 'rich-text');
    removeElement('fixture-slot-1col-1');
    const slot = useNewsletterStore.getState().doc!.rows[0].slots[0];
    expect(slot.element).toBeNull();
  });

  it('ELEM-12: removeElement is a no-op for unknown slotId', () => {
    // RED: removeElement does not exist yet
    const { removeElement } = useNewsletterStore.getState() as any;
    expect(() => removeElement('unknown-slot-id')).not.toThrow();
    // rows should be unchanged
    expect(useNewsletterStore.getState().doc!.rows).toHaveLength(FIXTURE_DOC.rows.length);
  });
});
