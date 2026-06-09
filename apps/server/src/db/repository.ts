// apps/server/src/db/repository.ts
// Shared types and interface for the DB repository abstraction.
// Both Postgres (Drizzle) and MSSQL implementations must satisfy NLRepository.

export type NewsletterDoc = Record<string, unknown>;

export interface NewsletterRow {
  id: string;
  title: string;
  updatedAt: Date;
  sectionCount: number;
}

export interface NewsletterFull {
  id: string;
  title: string;
  document: NewsletterDoc;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresetSummary {
  id: string;
  type: string;
  name: string;
  thumbnail: string | null;
}

export interface PresetFull {
  id: string;
  type: string;
  name: string;
  htmlContent: string;
  thumbnail: string | null;
}

export interface NewNewsletter {
  title: string;
  document: NewsletterDoc;
}

export interface NLRepository {
  // ── Newsletters ──────────────────────────────────────────────────────────────
  listNewsletters(): Promise<NewsletterRow[]>;
  getNewsletter(id: string): Promise<NewsletterFull | null>;
  createNewsletter(data: NewNewsletter): Promise<NewsletterFull>;
  updateNewsletterDocument(id: string, document: NewsletterDoc): Promise<{ id: string; updatedAt: Date } | null>;
  renameNewsletter(id: string, title: string): Promise<{ id: string; title: string; updatedAt: Date } | null>;
  deleteNewsletter(id: string): Promise<boolean>;

  // ── Presets ──────────────────────────────────────────────────────────────────
  listPresets(type: 'header' | 'footer'): Promise<PresetSummary[]>;
  getPreset(id: string): Promise<PresetFull | null>;
}
