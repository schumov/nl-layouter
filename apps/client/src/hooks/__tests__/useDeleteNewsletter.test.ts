// Stub tests for useDeleteNewsletter hook (NL-05)
// Wave 0: placeholders — implementation fills these in Phase 2 execution
import { describe, it } from 'vitest';

describe('useDeleteNewsletter', () => {
  it.todo('optimistically removes newsletter from ["newsletters"] cache immediately');
  it.todo('fires DELETE /newsletters/:id after 5 second undo window');
  it.todo('restores cache and shows error toast when DELETE fails');
  it.todo('cancels DELETE and restores cache when Undo is clicked within 5s');
});
