# Phase 8 Research: Header/Footer Presets & Pre-header

**Research date:** 2026-06-09
**Phase:** 08-header-footer-presets-and-pre-header
**Requirements:** HF-01, HF-02, HF-03, HF-04

---

## 1. Codebase Findings

### What already exists

| Item | Location | Status |
|------|----------|--------|
| `HeaderConfig` / `FooterConfig` types | `apps/client/src/types/newsletter.ts:104-114` | ✅ Exists |
| `NewsletterDoc.header` + `.footer` | `newsletter.ts:130-134` | ✅ Exists |
| `dialog.tsx` UI component | `apps/client/src/components/ui/dialog.tsx` | ✅ Ready |
| `BuilderHeader` component | `apps/client/src/components/builder/BuilderHeader.tsx` | ✅ Exists — needs "Header"/"Footer" buttons |
| `BuilderCanvas` component | `apps/client/src/components/builder/BuilderCanvas.tsx` | ✅ Exists — needs preset slots |
| `BuilderPage` wiring | `apps/client/src/pages/BuilderPage.tsx` | ✅ Exists — needs prop threading |
| Fastify plugin pattern | `apps/server/src/routes/newsletters.ts` | ✅ Pattern to follow |
| DB connection + schema | `apps/server/src/db/` | ✅ Simple Drizzle pattern |

### What is MISSING

| Item | Action |
|------|--------|
| `NewsletterDoc.preHeader` field | Add `preHeader?: string` to `NewsletterDoc` |
| `presets` DB table | Create via Drizzle schema + push |
| Seed data (4 presets) | Write `apps/server/src/db/seed.ts` + `tsx` script |
| `GET /presets` API route | New `apps/server/src/routes/presets.ts` plugin |
| `usePresets` hook | New client hook for fetching presets by type |
| Zustand store actions | `updateHeader`, `updateFooter`, `updatePreHeader` |
| `HeaderPresetSlot` component | New canvas component (top of BuilderCanvas) |
| `FooterPresetSlot` component | New canvas component (bottom of BuilderCanvas) |
| `PresetSelector` dialog | New component using dialog.tsx |
| Pre-header text field | Add to BuilderHeader |

---

## 2. NewsletterDoc Type Changes

### Current shape (newsletter.ts)

```typescript
export interface HeaderConfig {
  presetId: string;               // e.g. "header-minimal"
  variables: Record<string, string>;
}

export interface FooterConfig {
  presetId: string;               // e.g. "footer-legal"
  variables: Record<string, string>;
}

export interface NewsletterDoc {
  header: HeaderConfig;
  rows: Section[];
  footer: FooterConfig;
  globalStyles: GlobalStyles;
}
```

### Required addition

Add `preHeader` to `NewsletterDoc`:

```typescript
export interface NewsletterDoc {
  header: HeaderConfig;
  rows: Section[];
  footer: FooterConfig;
  globalStyles: GlobalStyles;
  preHeader?: string;   // HF-04: hidden inbox-preview text, max 90 chars
}
```

**`presetId` in `HeaderConfig.presetId`** — this is the right shape. The Zustand actions will dispatch:
- `updateHeader({ presetId: 'header-minimal' })`  →  updates `doc.header.presetId`
- `updateFooter({ presetId: 'footer-legal' })`   →  updates `doc.footer.presetId`
- `updatePreHeader('Preview text…')`               →  updates `doc.preHeader`

### INITIAL_DOC fix needed

`apps/server/src/routes/newsletters.ts` line 20:
```typescript
// CURRENT (uses placeholder presetId):
header: { presetId: 'infineon-default', variables: {} },
footer: { presetId: 'infineon-default', variables: {} },

// REQUIRED (use real seeded presetId):
header: { presetId: 'header-minimal-logo', variables: {} },
footer: { presetId: 'footer-simple-links', variables: {} },
```

---

## 3. DB Schema

### Drizzle table definition

```typescript
// apps/server/src/db/schema.ts — add presets table

import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

export const presets = pgTable('presets', {
  id:           text('id').primaryKey(),             // e.g. 'header-minimal-logo'
  type:         text('type').notNull(),              // 'header' | 'footer'
  name:         text('name').notNull(),              // display name
  htmlContent:  text('html_content').notNull(),      // raw HTML string (trusted seed data)
  thumbnail:    text('preview_thumbnail'),            // nullable — URL or base64 data URI
});

export type Preset    = typeof presets.$inferSelect;
export type NewPreset = typeof presets.$inferInsert;
```

**Key decisions:**
- `id` is a human-readable text slug (e.g. `'header-minimal-logo'`), not UUID — matches ROADMAP convention and allows stable references in `INITIAL_DOC`
- `thumbnail` nullable — Phase 8 seeds text-based HTML presets; thumbnail images are a Phase 9+ concern
- No `createdAt`/`updatedAt` — presets are read-only seed data (managed via migration/seed, not user edits)

---

## 4. Drizzle Seed Approach

**No `drizzle-kit` seed command exists.** The server `package.json` scripts are only `dev`, `build`, `start`, `typecheck`.

**Pattern: `tsx` seed script** (matches project's `tsx watch` dev pattern):

```typescript
// apps/server/src/db/seed.ts
import { db } from './connection.js';
import { presets } from './schema.js';

const SEED_PRESETS = [
  {
    id: 'header-minimal-logo',
    type: 'header',
    name: 'Minimal Logo',
    htmlContent: `<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;text-align:center;"><tr><td><span style="font-size:22px;font-weight:700;color:#0066cc;font-family:Arial,sans-serif;">Your Brand</span></td></tr></table>`,
    thumbnail: null,
  },
  {
    id: 'header-logo-banner',
    type: 'header',
    name: 'Logo + Banner',
    htmlContent: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0066cc;padding:24px;text-align:center;"><tr><td><span style="font-size:22px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Your Brand</span><p style="color:#cce0ff;font-size:14px;margin:8px 0 0;">Newsletter — June 2026</p></td></tr></table>`,
    thumbnail: null,
  },
  {
    id: 'footer-simple-links',
    type: 'footer',
    name: 'Simple Links',
    htmlContent: `<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 0;text-align:center;border-top:1px solid #e0e0e0;"><tr><td style="font-family:Arial,sans-serif;font-size:12px;color:#666;"><a href="#" style="color:#0066cc;text-decoration:none;">Unsubscribe</a> &nbsp;·&nbsp; <a href="#" style="color:#0066cc;text-decoration:none;">Privacy Policy</a></td></tr></table>`,
    thumbnail: null,
  },
  {
    id: 'footer-address-unsubscribe',
    type: 'footer',
    name: 'Address + Unsubscribe',
    htmlContent: `<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 0;text-align:center;border-top:1px solid #e0e0e0;"><tr><td style="font-family:Arial,sans-serif;font-size:12px;color:#666;"><p style="margin:0 0 8px;">Your Company · 123 Street · City, ST 00000</p><a href="#" style="color:#0066cc;text-decoration:none;">Unsubscribe</a></td></tr></table>`,
    thumbnail: null,
  },
];

async function seed() {
  await db.insert(presets)
    .values(SEED_PRESETS)
    .onConflictDoNothing();   // idempotent — safe to run multiple times
  console.log('Seeded', SEED_PRESETS.length, 'presets');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
```

Add to `apps/server/package.json` scripts:
```json
"seed": "tsx src/db/seed.ts"
```

Run: `pnpm --filter nl-layouter-server seed`

---

## 5. API Route Pattern

```typescript
// apps/server/src/routes/presets.ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { presets } from '../db/schema.js';

const TypeQuerySchema = z.object({ type: z.enum(['header', 'footer']) });

const presetsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /presets?type=header|footer — returns preset list for the given type
  fastify.get('/presets', async (request, reply) => {
    const parsed = TypeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'type must be "header" or "footer"' });
    }
    const rows = await db.select({
      id: presets.id, type: presets.type,
      name: presets.name, thumbnail: presets.thumbnail,
      // html_content NOT included in list response (too heavy for selector thumbnails)
    }).from(presets).where(eq(presets.type, parsed.data.type));
    return rows;
  });

  // GET /presets/:id — returns full preset including html_content
  fastify.get('/presets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db.select().from(presets).where(eq(presets.id, id));
    if (!row) return reply.code(404).send({ error: 'Preset not found' });
    return row;
  });
};

export default presetsRoutes;
```

Register in `apps/server/src/index.ts`:
```typescript
import presetsRoutes from './routes/presets.js';
await server.register(presetsRoutes);
```

---

## 6. HTML Sanitization Decision

**DOMPurify is NOT installed.** Since preset HTML is:
- Seeded by the developer (trusted content)
- Stored in the DB via the seed script (not user-submitted)
- Read-only at runtime

**Decision: use `dangerouslySetInnerHTML` directly** (no sanitization needed for trusted seed data in v1). Add a comment explaining the trust boundary.

For Phase 9 pre-header text (user-typed), use `element.textContent` assignment or escape HTML entities — this goes through the store as plain text, never dangerouslySetInnerHTML.

---

## 7. UI Component Availability

| Component | Available | Notes |
|-----------|-----------|-------|
| `Dialog` | ✅ `ui/dialog.tsx` | Full set: Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger |
| `Button` | ✅ `ui/button.tsx` | variants: default, outline, ghost |
| `Input` | ✅ `ui/input.tsx` | Used in all editors |
| Popover | ❌ Not in `ui/` | Use Dialog instead |
| Sheet | ❌ Not in `ui/` | Use Dialog instead |
| Tabs | ✅ `ui/tabs.tsx` | Could use for Header vs Footer tabs in selector |

**PresetSelector will use `Dialog`** (modal) triggered by a `Button` in BuilderHeader.

---

## 8. BuilderHeader Changes

Current structure:
```
[LEFT: back arrow] [CENTER: editable title] [RIGHT: save status + Export button]
```

Required additions:
```
[LEFT: back arrow] [CENTER: editable title] [RIGHT: Header | Footer | (pre-header toggle) | save status | Export button]
```

Changes:
1. Add "Header" and "Footer" `Button` (variant="outline", size="sm") to the RIGHT section
2. Each triggers a `PresetSelector` dialog with the appropriate `type` prop
3. Add a pre-header collapsible row below the main header bar (controlled by a chevron/toggle button)
4. Pre-header: `<input>` with max 90 chars + char count display (e.g. "12/90")

BuilderHeader needs new props:
```typescript
interface BuilderHeaderProps {
  id:         string;
  title:      string;
  saveStatus: SaveStatus;
  // Phase 8 additions:
  doc:        NewsletterDoc | null;         // for current preset IDs + preHeader
  onUpdateHeader:  (presetId: string) => void;
  onUpdateFooter:  (presetId: string) => void;
  onUpdatePreHeader: (text: string) => void;
}
```

---

## 9. Store Actions Needed

Add to `useNewsletterStore.ts`:

```typescript
// In interface NewsletterActions:
updateHeader:    (presetId: string) => void;
updateFooter:    (presetId: string) => void;
updatePreHeader: (text: string) => void;

// Implementations (Immer set):
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
```

---

## 10. Auto-save Integration

**No changes to `useAutoSave.ts` needed.** The hook watches `doc` from Zustand store and fires PUT /newsletters/:id with the whole doc on every change. Since `preHeader`, `header.presetId`, and `footer.presetId` are all fields on `doc`, any dispatch to the store will automatically trigger auto-save with the updated values.

---

## 11. usePresets Hook

```typescript
// apps/client/src/hooks/usePresets.ts
import { useQuery } from '@tanstack/react-query';

export interface PresetSummary {
  id: string;
  type: 'header' | 'footer';
  name: string;
  thumbnail: string | null;
}

export interface PresetFull extends PresetSummary {
  htmlContent: string;
}

const API = 'http://localhost:3001';

export function usePresets(type: 'header' | 'footer') {
  return useQuery<PresetSummary[]>({
    queryKey: ['presets', type],
    queryFn: async () => {
      const res = await fetch(`${API}/presets?type=${type}`);
      if (!res.ok) throw new Error('Failed to load presets');
      return res.json();
    },
    staleTime: Infinity,   // presets are static seed data — never re-fetch
  });
}

export function usePreset(id: string | null) {
  return useQuery<PresetFull>({
    queryKey: ['preset', id],
    queryFn: async () => {
      const res = await fetch(`${API}/presets/${id!}`);
      if (!res.ok) throw new Error('Failed to load preset');
      return res.json();
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}
```

---

## 12. HeaderPresetSlot / FooterPresetSlot

These are canvas components that render the selected preset's HTML at the top/bottom of BuilderCanvas:

```tsx
// HeaderPresetSlot — reads htmlContent from DB via usePreset hook
<HeaderPresetSlot presetId={doc.header.presetId} />
```

Structure:
- If `presetId` is null/empty or preset not found: render "None selected" placeholder
- If `presetId` matches a seeded preset: `dangerouslySetInnerHTML={{ __html: htmlContent }}`
- Wrapper `<div>` should have a light visual indicator so the user knows it's the header zone

BuilderCanvas changes:
```tsx
// BEFORE:
<div className="max-w-[640px] mx-auto px-4 py-8 space-y-2">
  <SortableRowList rows={doc.rows} />
</div>

// AFTER:
<div className="max-w-[640px] mx-auto py-8 space-y-2">
  <HeaderPresetSlot presetId={doc.header.presetId} />
  <div className="px-4">
    <SortableRowList rows={doc.rows} />
  </div>
  <FooterPresetSlot presetId={doc.footer.presetId} />
</div>
```

BuilderCanvas needs new props: `headerPresetId: string`, `footerPresetId: string`.

---

## 13. BuilderPage Wiring

BuilderPage needs to pass the new props:

```typescript
// In BuilderPage.tsx — read from store:
const doc = useNewsletterStore((state) => state.doc);
const updateHeader    = useNewsletterStore((s) => s.updateHeader);
const updateFooter    = useNewsletterStore((s) => s.updateFooter);
const updatePreHeader = useNewsletterStore((s) => s.updatePreHeader);

// BuilderHeader gets doc + 3 new callbacks
// BuilderCanvas gets header.presetId + footer.presetId
```

---

## 14. Key Risks / Open Questions

| # | Risk | Disposition |
|---|------|-------------|
| R-01 | `drizzle-kit push` for `presets` table — requires DB access during plan | Accept — same as Phase 1 DB push; document as manual step |
| R-02 | `htmlContent` is raw table HTML — needs `dangerouslySetInnerHTML` | Accept — trusted seed data; document trust boundary |
| R-03 | `INITIAL_DOC` in newsletters.ts uses `'infineon-default'` presetId which won't exist after Phase 8 | Fix INITIAL_DOC to use `'header-minimal-logo'` / `'footer-simple-links'` |
| R-04 | Existing newsletters in DB have `header.presetId: 'infineon-default'` | Accept — UI shows "None selected" for unknown presetIds; non-breaking |
| R-05 | `thumbnail` column is nullable and seeded as null — PresetSelector shows name only | Accept — Phase 8 uses text-only cards; thumbnails deferred |
| R-06 | `preHeader` is not in existing DB rows — optional field with `?` handles backward compat | Accept — `undefined` treated as empty string in UI |

---

## 15. Recommended Wave Structure

| Wave | Plans | Contents |
|------|-------|----------|
| 0 | 08-00 | TDD RED stubs — test files for all new Phase 8 components |
| 1 | 08-01 | Server: `presets` table schema + `drizzle-kit push` + seed script |
| 1 | 08-02 | Server: `GET /presets` + `GET /presets/:id` route; register in index.ts |
| 2 | 08-03 | Client types (`NewsletterDoc.preHeader`) + store actions + `usePresets` hook |
| 2 | 08-04 | `HeaderPresetSlot` + `FooterPresetSlot` canvas components |
| 3 | 08-05 | `PresetSelector` dialog component (header + footer mode, shared) |
| 3 | 08-06 | `BuilderHeader` Phase 8 additions (Header/Footer buttons + pre-header field) |
| 4 | 08-07 | `BuilderCanvas` + `BuilderPage` wiring (prop threading, full integration) |

**Total: 8 plans, 4 waves**

---

## Summary

Phase 8 is primarily a wiring phase with a lightweight server component:

- **Server**: New `presets` table (text-slug PK), seed with 4 presets, read-only API
- **Types**: Add `preHeader?: string` to `NewsletterDoc`
- **Store**: 3 new actions (updateHeader, updateFooter, updatePreHeader)
- **Canvas**: HeaderPresetSlot + FooterPresetSlot rendering seed HTML via `dangerouslySetInnerHTML`
- **UI**: PresetSelector dialog (text cards, no thumbnails) + pre-header input in BuilderHeader
- **Auto-save**: Free — works automatically via existing useAutoSave hook watching the full doc
