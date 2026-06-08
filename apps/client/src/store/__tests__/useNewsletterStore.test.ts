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
