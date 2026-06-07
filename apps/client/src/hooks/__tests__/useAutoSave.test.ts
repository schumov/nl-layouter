// Stub tests for useAutoSave hook (NL-06)
// Wave 0: placeholders — implementation fills these in Phase 2 execution
import { describe, it } from 'vitest';

describe('useAutoSave', () => {
  it.todo('does not save on initial doc load (isInitialLoadRef guard)');
  it.todo('shows "Saving…" status and fires PUT after 1500ms debounce');
  it.todo('debounces: resets timer on rapid consecutive doc changes');
  it.todo('shows "Save failed" and retries after 5 seconds on PUT error');
  it.todo('shows "Saved ✓" on success and returns to idle after 3 seconds');
  it.todo('clears all timers on unmount');
});
