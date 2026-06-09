// apps/client/src/store/useNewsletterStore.ts
//
// Zustand store with Immer middleware for the newsletter canvas state.
// Immer allows direct mutation syntax (state.doc.rows.push(section)) while
// producing immutable updates — essential for the deeply nested Row → Slot → Element tree.
//
// Phases 4-7 extend this store with additional actions. Only add SCAFFOLD actions here:
// the minimum needed to prove the store wires correctly with the type system.

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';  // NOT from 'immer' directly
import { current } from 'immer';
import { arrayMove } from '@dnd-kit/sortable';
import type {
  NewsletterDoc,
  Section,
  ElementUnion,
} from '../types/newsletter';
import { assertNeverElement } from '../types/newsletter';

// ─── createDefaultElement ─────────────────────────────────────────────────────
// Returns a fresh ElementUnion with sensible Phase 5 defaults.
// Phases 6–7 will populate real values via InspectorPanel editors.
// NOT exported — only used by addElement action inside this module.

function createDefaultElement(type: ElementUnion['type']): ElementUnion {
  const id = crypto.randomUUID();
  switch (type) {
    case 'image':
      return { type: 'image', id, src: '', alt: '', width: '100%' };
    case 'image-link':
      return { type: 'image-link', id, src: '', alt: '', href: '', width: '100%' };
    case 'button':
      return { type: 'button', id, label: 'Click me', href: '', backgroundColor: '#0066cc', textColor: '#ffffff', style: 'solid' };
    case 'rich-text':
      return {
        type: 'rich-text',
        id,
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        textStyle: 'body',
      };
    case 'divider':
      return { type: 'divider', id, color: '#cccccc', spacing: 16, thickness: 1 };
    default:
      return assertNeverElement(type);
  }
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface NewsletterState {
  doc: NewsletterDoc | null;
  selectedElementId: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface NewsletterActions {
  // Document lifecycle
  setDoc: (doc: NewsletterDoc) => void;
  clearDoc: () => void;

  // Selection
  setSelectedElement: (id: string | null) => void;

  // Section mutations (Phase 4 adds: reorderSections, duplicateSection)
  addSection: (section: Section) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  duplicateSection: (sectionId: string) => void;

  // Element mutations (Phase 5)
  addElement: (slotId: string, elementType: ElementUnion['type']) => void;
  removeElement: (slotId: string) => void;

  // Element mutations (Phase 6)
  updateElement: (slotId: string, patch: Partial<ElementUnion>) => void;

  // Header/Footer preset selection + pre-header text (Phase 8)
  updateHeader:    (presetId: string) => void;
  updateFooter:    (presetId: string) => void;
  updatePreHeader: (text: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useNewsletterStore = create<NewsletterState & NewsletterActions>()(
  immer((set) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    doc: null,
    selectedElementId: null,

    // ── Document lifecycle ─────────────────────────────────────────────────
    setDoc: (doc) =>
      set((state) => {
        state.doc = doc;
      }),

    clearDoc: () =>
      set((state) => {
        state.doc = null;
        state.selectedElementId = null;
      }),

    // ── Selection ──────────────────────────────────────────────────────────
    setSelectedElement: (id) =>
      set((state) => {
        state.selectedElementId = id;
      }),

    // ── Section mutations ──────────────────────────────────────────────────
    addSection: (section) =>
      set((state) => {
        state.doc?.rows.push(section);
      }),

    removeSection: (sectionId) =>
      set((state) => {
        if (!state.doc) return;
        // WR-04: clear selectedElementId if the removed section contains the selected slot
        const removed = state.doc.rows.find((r) => r.id === sectionId);
        if (removed?.slots.some((s) => s.id === state.selectedElementId)) {
          state.selectedElementId = null;
        }
        state.doc.rows = state.doc.rows.filter((r) => r.id !== sectionId);
      }),

    reorderSections: (activeId, overId) =>
      set((state) => {
        if (!state.doc) return;
        const rows = state.doc.rows;
        const activeIndex = rows.findIndex((r) => r.id === activeId);
        const overIndex  = rows.findIndex((r) => r.id === overId);
        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
        state.doc.rows = arrayMove(rows as Section[], activeIndex, overIndex);
        // Assignment (not splice) — arrayMove returns a NEW array; Immer allows assignment here
        // Same pattern as removeSection: state.doc.rows = ...filter()
      }),

    duplicateSection: (sectionId) =>
      set((state) => {
        if (!state.doc) return;
        const index = state.doc.rows.findIndex((r) => r.id === sectionId);
        if (index === -1) return;
        const clone = structuredClone<Section>(current(state.doc.rows[index]));
        // current() converts the Immer Proxy draft to a plain object so structuredClone can serialize it
        clone.id = crypto.randomUUID();
        clone.slots = clone.slots.map((slot) => ({
          ...slot,
          id: crypto.randomUUID(),
          element: slot.element ? { ...slot.element, id: crypto.randomUUID() } : null,
        }));
        state.doc.rows.splice(index + 1, 0, clone);
        // .splice is in-place mutation — valid in Immer (unlike arrayMove which is assignment)
      }),

    // ── Element mutations ──────────────────────────────────────────────────
    addElement: (slotId, elementType) =>
      set((state) => {
        if (!state.doc) return;
        for (const row of state.doc.rows) {
          const slot = row.slots.find((s) => s.id === slotId);
          if (slot) {
            // D-15: addElement on occupied slot overwrites existing element directly
            slot.element = createDefaultElement(elementType);
            return;
          }
        }
        // slotId not found — silent no-op (guard against stale IDs)
      }),

    removeElement: (slotId) =>
      set((state) => {
        if (!state.doc) return;
        for (const row of state.doc.rows) {
          const slot = row.slots.find((s) => s.id === slotId);
          if (slot) {
            slot.element = null;
            return;
          }
        }
        // slotId not found — silent no-op
      }),

    updateElement: (slotId, patch) =>
      set((state) => {
        if (!state.doc) return;
        for (const row of state.doc.rows) {
          for (const slot of row.slots) {
            if (slot.id === slotId && slot.element) {
              Object.assign(slot.element, patch);  // Immer in-place mutation — do NOT use spread
              return;  // early exit on first match
            }
          }
        }
        // slotId not found or slot.element is null — silent no-op
      }),

    updateHeader: (presetId) =>
      set((state) => {
        if (!state.doc) return;
        state.doc.header.presetId = presetId;
      }),

    updateFooter: (presetId) =>
      set((state) => {
        if (!state.doc) return;
        state.doc.footer.presetId = presetId;
      }),

    updatePreHeader: (text) =>
      set((state) => {
        if (!state.doc) return;
        state.doc.preHeader = text;
      }),
  }))
);
