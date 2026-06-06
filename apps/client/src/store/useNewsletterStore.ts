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
import type {
  NewsletterDoc,
  Section,
  ElementUnion,
  ColumnSlot,
} from '../types/newsletter';

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

  // Element mutations (Phase 5 adds: moveElement, replaceElement)
  setElement: (sectionId: string, slotId: string, element: ElementUnion | null) => void;
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
        if (state.doc) {
          state.doc.rows = state.doc.rows.filter((r) => r.id !== sectionId);
        }
      }),

    // ── Element mutations ──────────────────────────────────────────────────
    setElement: (sectionId, slotId, element) =>
      set((state) => {
        const section = state.doc?.rows.find((r) => r.id === sectionId);
        if (!section) return;
        const slot: ColumnSlot | undefined = section.slots.find((s) => s.id === slotId);
        if (slot) slot.element = element;
      }),
  }))
);
