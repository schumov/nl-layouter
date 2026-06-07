// Stub tests for useNewsletters / useCreateNewsletter hooks (NL-01, NL-02)
// Wave 0: placeholders — implementation fills these in Phase 2 execution
import { describe, it } from 'vitest';

describe('useNewsletters', () => {
  it.todo('returns NewsletterSummary[] when GET /newsletters succeeds');
  it.todo('returns empty array when no newsletters exist');
});

describe('useCreateNewsletter', () => {
  it.todo('POSTs to /newsletters with { title } and returns { id, title }');
  it.todo('invalidates ["newsletters"] query key on success');
});
