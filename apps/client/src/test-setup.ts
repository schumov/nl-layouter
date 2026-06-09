// ResizeObserver stub — jsdom does not implement this API.
// TipTap's EditorView uses ResizeObserver on mount; without this stub,
// any test that renders a live <EditorContent> will throw ReferenceError.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

import '@testing-library/jest-dom';
