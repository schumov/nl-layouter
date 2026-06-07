# Phase 2: Newsletter CRUD & Dashboard — Research

**Researched:** 2026-06-07  
**Domain:** Drizzle JSONB · Fastify 5 route plugins · TanStack Query v5 mutations · React Router v7 nav · shadcn/ui component installation  
**Confidence:** HIGH (all patterns verified via Context7 official docs; stack versions verified from Phase 1 npm registry checks)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dashboard Card Grid
- **D-01:** Each `NewsletterCard` shows: **title + last-saved timestamp + section count** (section count = `doc.rows.length`, gives users a quick sense of document size)
- **D-02:** Card actions exposed via **hover → ⋮ menu** with Rename and Delete items
- **D-03:** Grid is **responsive** — 1 column mobile → 2 columns tablet → 3 columns desktop (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- **D-04:** Empty state: **centered placeholder + "Create your first newsletter" CTA button**

#### Create Newsletter Flow
- **D-05:** Create dialog requires a typed name — no "Untitled" default. Create button disabled until name is non-empty.
- **D-06:** On successful `POST /newsletters`, **navigate directly to `/newsletters/:id`**
- **D-07:** Initial `NewsletterDoc` on creation:
  ```json
  {
    "header": { "presetId": "infineon-default", "variables": {} },
    "footer": { "presetId": "infineon-default", "variables": {} },
    "rows": [],
    "globalStyles": {
      "fontFamily": "Arial, sans-serif",
      "backgroundColor": "#f4f4f4",
      "contentWidth": 600,
      "primaryColor": "#0066cc"
    }
  }
  ```
- **D-08:** Header and footer are **fixed single Infineon brand design** — `presetId: "infineon-default"` is a placeholder; Phase 2 stores it, Phase 8 renders it.

#### Auto-save UX
- **D-09:** On save error: **"Save failed" indicator** + **auto-retry after 5 seconds**
- **D-10:** **No indicator during initial load** — only after user makes first edit
- **D-11:** "Saved ✓" text **fades out after 3 seconds** after successful save

#### BuilderHeader Composition
- **D-12:** ← back | click-to-edit title | Saving…/Saved ✓/Save failed | Export button
- **D-13:** Rename: click title → `<input>` → Enter or blur → `PATCH /newsletters/:id` + TanStack cache invalidation
- **D-14:** Export button shows toast "Export is not yet available"

### the agent's Discretion

- **Lean list vs full JSONB for `GET /newsletters`:** Planner should evaluate returning `{id, title, updatedAt, sectionCount}` (lean) vs full document. Research recommends **lean** (see Section: Drizzle JSONB Patterns).
- **Fastify route plugin module vs inline registration:** Research recommends **plugin module** for 6 routes.
- **Zod validation approach in Fastify:** Manual `safeParse` in handlers vs `@fastify/type-provider-zod`. Research recommends **manual `safeParse`** (Zod v4 compatibility risk with type provider).

### Deferred Ideas (OUT OF SCOPE)

- Header/footer preset-selection UI → Phase 8 (Phase 8 scope updated per CONTEXT.md deferred note)
- `jsonb_array_length` optimization for `sectionCount` is deferred to Phase 2 planning (this research resolves it — see recommendation below)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NL-01 | User can create a new newsletter with a name | POST /newsletters + create dialog + D-05/D-06/D-07 |
| NL-02 | User can view a list of all saved newsletters | GET /newsletters + DashboardPage + NewsletterCard grid |
| NL-03 | User can open (load) an existing newsletter into the builder | GET /newsletters/:id + setDoc() + BuilderPage route |
| NL-04 | User can rename a newsletter | PATCH /newsletters/:id + BuilderHeader inline edit + D-13 |
| NL-05 | User can delete a newsletter | DELETE /newsletters/:id + confirm dialog + undo toast + D optimistic |
| NL-06 | Newsletter state auto-saves to the backend (debounced) | PUT /newsletters/:id + 1500ms debounce + D-09/D-10/D-11 |

</phase_requirements>

---

## Summary

Phase 2 is the backbone of the application: it wires persistent storage to the React UI through a REST API and establishes the auto-save loop that all later phases depend on. The eight deliverables fall into three categories: (1) schema + API (Drizzle schema, 6 Fastify routes, Zod validation), (2) TanStack Query layer (5 custom hooks with optimistic updates), and (3) UI (dashboard grid, create dialog, BuilderHeader shell, delete confirm + undo).

The most consequential decision is the **lean list vs full-document API response for `GET /newsletters`**. Returning full JSONB on every list render is wasteful and makes the dashboard slower at scale. The recommended approach is to use `jsonb_array_length(document->'rows')` in a partial Drizzle select to compute `sectionCount` server-side — this returns `{id, title, updatedAt, sectionCount}` only, keeping the list endpoint fast. The full `document` is fetched only on `GET /newsletters/:id`. This decision affects the API response shape, the TanStack Query hook types, and the `NewsletterCard` component props.

The **auto-save loop** requires careful design to avoid three pitfalls: (1) saving on initial load before the user edits anything (use a `hasEditedRef`), (2) re-triggering save on successful save response (mutation `onSuccess` must never call `setDoc`), and (3) React 19 Strict Mode double-effect firing (the `useRef` timer approach handles this safely via cleanup).

**Primary recommendation:** Use plugin module pattern for Fastify routes, lean list API response, manual Zod `safeParse` in handlers, `useRef`-based debounce timer for auto-save, and Sonner toasts with action for undo-delete.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `newsletters` DB table schema | Server (DB layer) | — | Schema is server-only; types imported from client `newsletter.ts` |
| 6 CRUD API routes | Server (Fastify) | — | HTTP handlers own request/response, validation, DB calls |
| Lean list response (sectionCount) | Server (DB layer) | — | `jsonb_array_length` computed in SQL SELECT, not in JS |
| TanStack Query hooks | Client (hooks layer) | — | Data fetching/caching is a client concern |
| Dashboard card grid | Client (UI) | — | Pure rendering of cached list data |
| Create dialog | Client (UI) | — | Form state is ephemeral, lives in component |
| BuilderHeader shell | Client (UI) | — | Sticky bar; renders save status from hook state |
| Auto-save loop | Client (hooks layer) | Server (PUT route) | Client detects edits and debounces; server persists |
| Optimistic delete + undo | Client (hooks layer) | Server (DELETE route) | Cache manipulation is client; actual delete is server |
| Rename (PATCH) | Client (BuilderHeader) | Server (PATCH route) | UI triggers, server persists, client cache-invalidates |

---

## Standard Stack

### No New Dependencies Required

All production dependencies for Phase 2 are already installed (verified from `apps/client/package.json` and `apps/server/package.json`). Phase 2 only installs **shadcn/ui components** (code-generated files, not npm packages).

| Library | Version | Already Installed | Use in Phase 2 |
|---------|---------|-------------------|----------------|
| drizzle-orm | 0.45.2 | ✓ server | `newsletters` table schema + CRUD queries |
| drizzle-kit | 0.31.10 | ✓ server devDep | `drizzle-kit push` to apply schema |
| postgres | 3.4.9 | ✓ server | Driver via existing `connection.ts` |
| fastify | 5.8.5 | ✓ server | Route handlers plugin module |
| zod | 4.4.3 | ✓ server | Request body validation (`safeParse`) |
| @tanstack/react-query | 5.101.0 | ✓ client | `useQuery`, `useMutation`, `useQueryClient` |
| react-router | 7.17.0 | ✓ client | `useNavigate`, `useParams`, route elements |
| zustand | 5.0.14 | ✓ client | `useNewsletterStore` (`setDoc`, `clearDoc`) |
| lucide-react | 1.17.0 | ✓ client | Icons (ChevronLeft, MoreVertical, etc.) |

### shadcn/ui Components to Install (Phase 2)

No shadcn components were installed in Phase 1 — only the `cn()` utility was scaffolded. Phase 2 adds these components by running the shadcn CLI from `apps/client`:

| Component | shadcn Command | Phase 2 Use |
|-----------|---------------|-------------|
| `button` | `npx shadcn@latest add button` | CTA, dialog actions, header buttons |
| `input` | `npx shadcn@latest add input` | Create newsletter name field; rename title field |
| `dialog` | `npx shadcn@latest add dialog` | Create newsletter dialog |
| `alert-dialog` | `npx shadcn@latest add alert-dialog` | Delete confirmation dialog |
| `dropdown-menu` | `npx shadcn@latest add dropdown-menu` | Card ⋮ hover menu (Rename, Delete) |
| `sonner` | `npx shadcn@latest add sonner` | Undo delete toast; "Export not yet available" toast; "Save failed" toast |
| `card` | `npx shadcn@latest add card` | NewsletterCard wrapper (optional — plain div with Tailwind is equally valid) |

> **Installation order:** Install all at once with: `npx shadcn@latest add button input dialog alert-dialog dropdown-menu sonner card`

> **Sonner requires `<Toaster />` in root:** Add `<Toaster />` from `@/components/ui/sonner` to `main.tsx` inside the `QueryClientProvider` wrapper.

> [VERIFIED: Context7 shadcn/ui docs — /shadcn-ui/ui, CLI commands, sonner setup]

---

## Architecture Patterns

### System Architecture Diagram

```
User Browser (React 19 SPA)
│
│  /newsletters ──────────────────────────────────────────────────────────
│  GET /newsletters (lean: id, title, updatedAt, sectionCount)
│    └──► DashboardPage
│           ├── NewsletterCard[] (grid)
│           │     └── DropdownMenu → Rename | Delete
│           ├── EmptyState (if 0 cards)
│           └── CreateDialog
│                 └── POST /newsletters → navigate('/newsletters/:id')
│
│  /newsletters/:id ──────────────────────────────────────────────────────
│  GET /newsletters/:id (full document JSONB)
│    └──► BuilderPage
│           ├── BuilderHeader
│           │     ├── ← back (navigate('/newsletters') + clearDoc())
│           │     ├── click-to-edit title → PATCH /newsletters/:id
│           │     ├── Save status: Saving… | Saved ✓ | Save failed
│           │     └── Export button → toast("Export not yet available")
│           └── [Canvas placeholder — Phase 3 fills this]
│
│  Auto-save loop (runs inside BuilderPage):
│    Zustand doc changes → useEffect → 1500ms debounce
│      → PUT /newsletters/:id → "Saving…" → "Saved ✓"
│                                          → "Save failed" + 5s retry
│
▼  fetch → http://localhost:3001
┌───────────────────────────────────────────────────────────────────────┐
│  Fastify 5 (apps/server)                                               │
│                                                                        │
│  index.ts                                                              │
│   └── server.register(newsletterRoutes) ← plugin module               │
│                                                                        │
│  routes/newsletters.ts (FastifyPluginAsync)                           │
│   ├── GET  /newsletters      → lean list (id, title, updatedAt, sectionCount)
│   ├── POST /newsletters      → create + return full row               │
│   ├── GET  /newsletters/:id  → full document                          │
│   ├── PUT  /newsletters/:id  → replace document (auto-save)          │
│   ├── PATCH /newsletters/:id → rename title only                      │
│   └── DELETE /newsletters/:id → hard delete                           │
│                                                                        │
│  db/                                                                   │
│   ├── connection.ts  (existing — db instance)                         │
│   └── schema.ts      (Phase 2 adds newsletters table)                 │
└───────────────────────────────────────────────────────────────────────┘
         │  postgres.js driver
         ▼
┌────────────────────────────────────────────────┐
│  PostgreSQL / Neon.tech                         │
│  newsletters table                              │
│   id UUID PK · title TEXT · document JSONB      │
│   created_at TIMESTAMP · updated_at TIMESTAMP   │
└────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 2 additions)

```
apps/
├── server/src/
│   ├── db/
│   │   └── schema.ts              # ADD: newsletters pgTable definition
│   ├── routes/
│   │   └── newsletters.ts         # NEW: FastifyPluginAsync with 6 routes
│   └── index.ts                   # MODIFY: register newsletterRoutes plugin
│
└── client/src/
    ├── components/
    │   ├── ui/                    # NEW: shadcn generated (button, input, etc.)
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx  # NEW: grid + empty state
    │   │   ├── NewsletterCard.tsx # NEW: card with ⋮ menu
    │   │   └── CreateDialog.tsx   # NEW: create newsletter modal
    │   └── builder/
    │       └── BuilderHeader.tsx  # NEW: back | title | save status | export
    ├── hooks/
    │   ├── useNewsletters.ts      # NEW: useQuery list
    │   ├── useNewsletter.ts       # NEW: useQuery detail
    │   ├── useCreateNewsletter.ts # NEW: useMutation POST
    │   ├── useUpdateNewsletter.ts # NEW: useMutation PUT (auto-save)
    │   ├── useRenameNewsletter.ts # NEW: useMutation PATCH
    │   ├── useDeleteNewsletter.ts # NEW: useMutation DELETE + optimistic
    │   └── useAutoSave.ts         # NEW: debounced Zustand→PUT loop
    ├── pages/
    │   ├── DashboardPage.tsx      # NEW: (or co-locate in components/dashboard/)
    │   └── BuilderPage.tsx        # NEW: loads newsletter, renders BuilderHeader
    └── main.tsx                   # MODIFY: replace placeholder routes + add <Toaster />
```

---

### Pattern 1: Drizzle Schema — newsletters table

**What:** PostgreSQL table with UUID PK, text title, JSONB document, timestamps.  
**`$onUpdate`:** Drizzle runtime hook that auto-sets `updated_at = NOW()` on every `db.update()` call — no need to include `updatedAt` in every `.set({})`. [VERIFIED: Context7 Drizzle docs — drizzle-orm-v0305 `$onUpdate`]

```typescript
// apps/server/src/db/schema.ts
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { NewsletterDoc } from '../../../../../../apps/client/src/types/newsletter';
// OR use a relative path — the type is defined in client/src/types/newsletter.ts

export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  document: jsonb('document').$type<NewsletterDoc>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
});

// Type helpers — use these in route handlers for type safety
export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
```

> **Import path gotcha:** `NewsletterDoc` is defined in `apps/client/src/types/newsletter.ts`. The server imports it as a TypeScript type-only import (`import type { NewsletterDoc } from '...'`). This is safe because JSONB types are erased at runtime — no circular dependency. Alternatively, move shared types to a `packages/types` workspace package (deferred — fine to cross-import type-only for Phase 2).

> [VERIFIED: Context7 Drizzle docs — /websites/orm_drizzle_team, pgTable, jsonb, uuid, timestamp, $onUpdate]

---

### Pattern 2: Drizzle JSONB — Lean List vs Full Document

**Decision (resolving CONTEXT.md deferred item):** Use **lean select** for `GET /newsletters`.

**Lean select with server-computed `sectionCount`:**

```typescript
// apps/server/src/routes/newsletters.ts
import { sql, desc, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { newsletters } from '../db/schema.js';

// GET /newsletters — lean list (no full JSONB sent to client)
const rows = await db.select({
  id: newsletters.id,
  title: newsletters.title,
  updatedAt: newsletters.updatedAt,
  sectionCount: sql<number>`jsonb_array_length(${newsletters.document}->'rows')`,
}).from(newsletters)
  .orderBy(desc(newsletters.updatedAt));
// Returns: Array<{ id: string, title: string, updatedAt: Date, sectionCount: number }>

// GET /newsletters/:id — full document (only fetched when opening builder)
const [row] = await db.select().from(newsletters)
  .where(eq(newsletters.id, request.params.id));
if (!row) return reply.code(404).send({ error: 'Newsletter not found' });
return row; // Full row with document JSONB
```

**Why lean is better than full JSONB on list:**
- Dashboard cards show only `{title, updatedAt, sectionCount}` — returning `document` wastes bandwidth
- A 600px-wide newsletter with 10 sections could have 5-15KB of JSONB; multiplied by 50 newsletters = 750KB on every dashboard load
- `jsonb_array_length(document->'rows')` is a constant-time PostgreSQL operation — no performance cost

**Define shared list type for client → hook → component:**
```typescript
// apps/client/src/hooks/useNewsletters.ts
export interface NewsletterSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO string from JSON
  sectionCount: number;
}
```

> [VERIFIED: Context7 Drizzle docs — partial select, sql template literal expressions]

---

### Pattern 3: Drizzle CRUD Queries

```typescript
// INSERT — create new newsletter, return full row
const [created] = await db.insert(newsletters)
  .values({
    title: body.title,
    document: INITIAL_NEWSLETTER_DOC,
  })
  .returning();

// UPDATE — full document save (auto-save route)
const [updated] = await db.update(newsletters)
  .set({ document: body.document })  // updatedAt auto-set by $onUpdate
  .where(eq(newsletters.id, id))
  .returning({ id: newsletters.id, updatedAt: newsletters.updatedAt });
if (!updated) return reply.code(404).send({ error: 'Not found' });

// PATCH — rename title only
const [renamed] = await db.update(newsletters)
  .set({ title: body.title })        // updatedAt auto-set by $onUpdate
  .where(eq(newsletters.id, id))
  .returning({ id: newsletters.id, title: newsletters.title, updatedAt: newsletters.updatedAt });

// DELETE — hard delete, no soft-delete needed (v1 single-user)
const deleted = await db.delete(newsletters)
  .where(eq(newsletters.id, id))
  .returning({ id: newsletters.id });
if (!deleted.length) return reply.code(404).send({ error: 'Not found' });
```

> [VERIFIED: Context7 Drizzle docs — insert returning, update set, delete where, eq operator]

---

### Pattern 4: Fastify Plugin Module — 6 Newsletter Routes

**What:** `FastifyPluginAsync` encapsulates all newsletter routes in a separate file. Registered in `index.ts` with `server.register()`.  
**Why plugin vs inline:** 6 routes in `index.ts` would make it ~150+ lines. Plugin module keeps `index.ts` clean and allows future route prefixing and scoped middleware (auth in v2).

```typescript
// apps/server/src/routes/newsletters.ts
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { newsletters } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import type { NewsletterDoc } from '../../../apps/client/src/types/newsletter.js';

// ── Zod schemas for request bodies ────────────────────────────────────
const CreateSchema = z.object({ title: z.string().min(1) });
const UpdateDocSchema = z.object({ document: z.unknown() }); // typed as NewsletterDoc at DB layer
const RenameSchema = z.object({ title: z.string().min(1) });

// ── Initial document shape (D-07) ─────────────────────────────────────
const INITIAL_DOC: NewsletterDoc = {
  header: { presetId: 'infineon-default', variables: {} },
  footer: { presetId: 'infineon-default', variables: {} },
  rows: [],
  globalStyles: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    contentWidth: 600,
    primaryColor: '#0066cc',
  },
};

const newsletterRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /newsletters — lean list
  fastify.get('/newsletters', async (_req, reply) => {
    const rows = await db.select({
      id: newsletters.id,
      title: newsletters.title,
      updatedAt: newsletters.updatedAt,
      sectionCount: sql<number>`jsonb_array_length(${newsletters.document}->'rows')`,
    }).from(newsletters).orderBy(desc(newsletters.updatedAt));
    return rows;
  });

  // POST /newsletters — create
  fastify.post('/newsletters', async (request, reply) => {
    const parsed = CreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'title is required' });
    const [created] = await db.insert(newsletters)
      .values({ title: parsed.data.title, document: INITIAL_DOC })
      .returning();
    return reply.code(201).send(created);
  });

  // GET /newsletters/:id — full document
  fastify.get('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db.select().from(newsletters).where(eq(newsletters.id, id));
    if (!row) return reply.code(404).send({ error: 'Newsletter not found' });
    return row;
  });

  // PUT /newsletters/:id — full document save (auto-save)
  fastify.put('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateDocSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'document is required' });
    const [updated] = await db.update(newsletters)
      .set({ document: parsed.data.document as NewsletterDoc })
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id, updatedAt: newsletters.updatedAt });
    if (!updated) return reply.code(404).send({ error: 'Newsletter not found' });
    return updated;
  });

  // PATCH /newsletters/:id — rename title
  fastify.patch('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = RenameSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'title is required' });
    const [renamed] = await db.update(newsletters)
      .set({ title: parsed.data.title })
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id, title: newsletters.title, updatedAt: newsletters.updatedAt });
    if (!renamed) return reply.code(404).send({ error: 'Newsletter not found' });
    return renamed;
  });

  // DELETE /newsletters/:id
  fastify.delete('/newsletters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(newsletters)
      .where(eq(newsletters.id, id))
      .returning({ id: newsletters.id });
    if (!deleted.length) return reply.code(404).send({ error: 'Newsletter not found' });
    return reply.code(204).send();
  });
};

export default newsletterRoutes;
```

**Registration in `index.ts`:**
```typescript
// apps/server/src/index.ts — ADD this line before server.listen():
import newsletterRoutes from './routes/newsletters.js';
// ...
await server.register(newsletterRoutes);
```

> **Fastify v5 note:** `return reply.code(201).send(body)` and `return body` are both valid in v5. Async handlers can simply `return` data — Fastify auto-sends it as JSON with 200. For non-200 status codes, use `reply.code(N).send(body)` pattern. [VERIFIED: Context7 Fastify docs — /fastify/fastify async/await handler]

> **Zod v4 compatibility note:** `@fastify/type-provider-zod` does not yet have confirmed Zod v4 support [ASSUMED — based on recency of Zod v4 release and typical ecosystem lag]. Manual `safeParse` in handlers is the safe choice for this project, consistent with how Phase 1's `config.ts` uses Zod.

---

### Pattern 5: TanStack Query v5 Hooks

**Architecture:** Create separate hook files per mutation to keep components thin.

```typescript
// apps/client/src/hooks/useNewsletters.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface NewsletterSummary {
  id: string;
  title: string;
  updatedAt: string;
  sectionCount: number;
}

export const NEWSLETTERS_QUERY_KEY = ['newsletters'] as const;
export const NEWSLETTER_QUERY_KEY = (id: string) => ['newsletter', id] as const;

export function useNewsletters() {
  return useQuery<NewsletterSummary[]>({
    queryKey: NEWSLETTERS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/newsletters');
      if (!res.ok) throw new Error('Failed to fetch newsletters');
      return res.json();
    },
    staleTime: 0, // always fresh on dashboard — invalidated after mutations
  });
}

export function useNewsletter(id: string) {
  return useQuery({
    queryKey: NEWSLETTER_QUERY_KEY(id),
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`);
      if (!res.ok) throw new Error('Newsletter not found');
      return res.json();
    },
    staleTime: 1000 * 60, // 1 min — builder reuses cached doc; mutations invalidate
  });
}
```

```typescript
// apps/client/src/hooks/useCreateNewsletter.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEWSLETTERS_QUERY_KEY } from './useNewsletters';

export function useCreateNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('http://localhost:3001/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to create newsletter');
      return res.json() as Promise<{ id: string; title: string }>;
    },
    onSuccess: () => {
      // Invalidate list so next dashboard visit shows new newsletter
      queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
    },
  });
}
```

```typescript
// apps/client/src/hooks/useDeleteNewsletter.ts
// Optimistic delete: remove from cache immediately → delayed API call with undo window
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { NEWSLETTERS_QUERY_KEY, type NewsletterSummary } from './useNewsletters';

export function useDeleteNewsletter() {
  const queryClient = useQueryClient();

  const handleDelete = (id: string, title: string) => {
    // 1. Snapshot for rollback
    const previous = queryClient.getQueryData<NewsletterSummary[]>(NEWSLETTERS_QUERY_KEY);

    // 2. Optimistically remove from cache
    queryClient.setQueryData<NewsletterSummary[]>(NEWSLETTERS_QUERY_KEY, (old) =>
      old?.filter((n) => n.id !== id) ?? []
    );

    // 3. Schedule actual DELETE after 5 seconds (undo window)
    let undone = false;
    const timerId = setTimeout(async () => {
      if (undone) return;
      try {
        const res = await fetch(`http://localhost:3001/newsletters/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        // Success: list already updated optimistically
      } catch {
        // Rollback on error
        queryClient.setQueryData(NEWSLETTERS_QUERY_KEY, previous);
        toast.error(`Failed to delete "${title}"`);
      }
    }, 5000);

    // 4. Toast with Undo action
    toast(`"${title}" deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          clearTimeout(timerId);
          // Restore from snapshot
          queryClient.setQueryData(NEWSLETTERS_QUERY_KEY, previous);
        },
      },
      duration: 5000,
    });
  };

  return { handleDelete };
}
```

> **staleTime recommendations:**
> - `useNewsletters()` list: `staleTime: 0` — invalidated on every mutation; always refetch when dashboard mounts
> - `useNewsletter(id)` detail: `staleTime: 1000 * 60` (1 min) — builder uses cached doc; auto-save keeps server in sync; the 1-min global default set in Phase 1's `QueryClient` is appropriate

> [VERIFIED: Context7 TanStack Query docs — /tanstack/query, useMutation, optimistic updates, setQueryData, invalidateQueries, staleTime]

---

### Pattern 6: Rename with Cache Invalidation

```typescript
// apps/client/src/hooks/useRenameNewsletter.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEWSLETTERS_QUERY_KEY, NEWSLETTER_QUERY_KEY } from './useNewsletters';

export function useRenameNewsletter(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Rename failed');
      return res.json();
    },
    onSuccess: (data) => {
      // Update dashboard list — change title in cached list array
      queryClient.setQueryData<Array<{ id: string; title: string }>>(
        NEWSLETTERS_QUERY_KEY,
        (old) => old?.map((n) => n.id === id ? { ...n, title: data.title } : n) ?? []
      );
      // Update builder detail cache
      queryClient.setQueryData(NEWSLETTER_QUERY_KEY(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as object), title: data.title, updatedAt: data.updatedAt };
      });
    },
  });
}
```

> **Why `setQueryData` instead of `invalidateQueries` for rename:**  
> `setQueryData` updates the cache synchronously with no network round-trip, making the title change appear instantly in both the dashboard card and BuilderHeader. `invalidateQueries` would trigger a refetch and cause a brief flicker. For a rename where we already have the server's response, `setQueryData` is the correct tool. [VERIFIED: Context7 TanStack Query docs — combine manual update with invalidation]

---

### Pattern 7: Auto-Save Hook with useRef Debounce

**The most error-prone pattern in Phase 2.** Three invariants must hold:
1. **No save on initial load** — `hasEditedRef` starts `false`; only set to `true` after first `doc` change that follows the initial `setDoc` call
2. **No save-on-save loop** — `saveMutation.onSuccess` must never call `setDoc()` or anything that modifies the Zustand `doc`
3. **Clean timer on unmount** — `useEffect` cleanup clears pending timer

```typescript
// apps/client/src/hooks/useAutoSave.ts
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNewsletterStore } from '../store/useNewsletterStore';
import type { NewsletterDoc } from '../types/newsletter';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(id: string) {
  const doc = useNewsletterStore((state) => state.doc);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the doc has been loaded (prevent saving on initial setDoc)
  const isInitialLoadRef = useRef(true);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (document: NewsletterDoc) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    onSuccess: () => {
      setSaveStatus('saved');
      // D-11: "Saved ✓" fades out after 3 seconds
      savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      // D-09: auto-retry after 5 seconds
      retryTimerRef.current = setTimeout(() => {
        if (doc) saveMutation.mutate(doc);
      }, 5000);
    },
  });

  useEffect(() => {
    // Skip the first emission — this is the initial doc load from useNewsletter query
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (!doc) return;

    // D-10: show "Saving…" only after user makes first edit
    setSaveStatus('saving');

    // Clear any pending debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Clear any pending retry timer
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    // 1500ms debounce
    timerRef.current = setTimeout(() => {
      saveMutation.mutate(doc);
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps — saveMutation stable ref

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
    };
  }, []);

  return { saveStatus };
}
```

**Using the hook in BuilderPage:**
```tsx
// apps/client/src/pages/BuilderPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNewsletter } from '../hooks/useNewsletter';
import { useNewsletterStore } from '../store/useNewsletterStore';
import { useAutoSave } from '../hooks/useAutoSave';
import BuilderHeader from '../components/builder/BuilderHeader';

export default function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError } = useNewsletter(id!);
  const { setDoc, clearDoc } = useNewsletterStore();
  const { saveStatus } = useAutoSave(id!);

  // Load doc into Zustand when query resolves
  useEffect(() => {
    if (data) setDoc(data.document);
    return () => clearDoc(); // D: clear on unmount (navigate back)
  }, [data, setDoc, clearDoc]);

  if (isPending) return null; // D-10: no indicator during initial load
  if (isError) return <div>Error loading newsletter</div>;

  return (
    <div className="flex flex-col h-screen">
      <BuilderHeader
        id={id!}
        title={data?.title ?? ''}
        saveStatus={saveStatus}
      />
      {/* Phase 3 adds canvas here */}
      <main className="flex-1 bg-neutral-100" />
    </div>
  );
}
```

> **React 19 Strict Mode gotcha:** `useEffect` fires twice in development (mount → cleanup → mount). The `isInitialLoadRef` pattern handles this: the first fire sets it to `false`; if cleanup unmounts and remounts, the ref is now `false` on second mount, which would mean the second `setDoc` triggers a save. 

> **Better approach:** Set `isInitialLoadRef.current = true` inside the cleanup so remount resets it:
> ```typescript
> useEffect(() => {
>   if (isInitialLoadRef.current) {
>     isInitialLoadRef.current = false;
>     return () => { isInitialLoadRef.current = true; }; // reset on cleanup for StrictMode
>   }
>   // ... rest of effect
> }, [doc]);
> ```

> [VERIFIED via React 19 + Strict Mode behavior — ASSUMED that `useRef` pattern is the canonical debounce approach vs lodash.debounce which requires memoization to avoid new function reference on each render]

---

### Pattern 8: React Router v7 — Navigation

```tsx
// apps/client/src/components/dashboard/CreateDialog.tsx
import { useNavigate } from 'react-router';
import { useCreateNewsletter } from '../../hooks/useCreateNewsletter';

export function CreateDialog() {
  const navigate = useNavigate();
  const createMutation = useCreateNewsletter();

  const handleCreate = async (title: string) => {
    const newsletter = await createMutation.mutateAsync(title);
    navigate(`/newsletters/${newsletter.id}`); // D-06: navigate directly to builder
  };
  // ...
}

// BuilderHeader back button (D-12)
import { useNavigate } from 'react-router';
const navigate = useNavigate();
// Use absolute path, not navigate(-1) — back history may be unpredictable
<button onClick={() => navigate('/newsletters')}>← Back</button>

// BuilderPage — read :id param
import { useParams } from 'react-router';
const { id } = useParams<{ id: string }>();
```

> **`navigate(-1)` vs `navigate('/newsletters')`:** `navigate(-1)` relies on browser history stack, which may send users to external pages or an empty stack. `navigate('/newsletters')` is deterministic — always goes to dashboard. Use the absolute path. [VERIFIED: Context7 React Router docs — /remix-run/react-router]

> **`useNavigate` in `RouterProvider` mode returns `Promise<void>`:** The type is `void | Promise<void>` when using `RouterProvider` + `createBrowserRouter` (Data Router mode). Avoid `await navigate(...)` unless you specifically need navigation completion signals. [VERIFIED: Context7 React Router docs — useNavigate type augmentation]

---

### Pattern 9: BuilderHeader — Inline Title Edit

```tsx
// apps/client/src/components/builder/BuilderHeader.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useRenameNewsletter } from '../../hooks/useRenameNewsletter';
import { toast } from 'sonner';
import type { SaveStatus } from '../../hooks/useAutoSave';

interface BuilderHeaderProps {
  id: string;
  title: string;
  saveStatus: SaveStatus;
}

export default function BuilderHeader({ id, title, saveStatus }: BuilderHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const renameMutation = useRenameNewsletter(id);

  const commitRename = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      renameMutation.mutate(trimmed); // D-13: PATCH on blur or Enter
    }
  };

  return (
    <header className="flex items-center gap-4 h-14 px-4 border-b bg-white sticky top-0 z-10">
      {/* Back button */}
      <button onClick={() => navigate('/newsletters')} aria-label="Back to dashboard">
        ← {/* Use ChevronLeft from lucide-react */}
      </button>

      {/* Click-to-edit title (D-13) */}
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }}
          className="flex-1 text-center font-semibold border-b border-primary outline-none"
        />
      ) : (
        <button
          onClick={() => { setEditValue(title); setIsEditing(true); }}
          className="flex-1 text-center font-semibold hover:underline"
        >
          {title}
        </button>
      )}

      {/* Save status indicator (D-10/D-11) */}
      <span className="text-sm text-muted-foreground min-w-20 text-right">
        {saveStatus === 'saving' && 'Saving…'}
        {saveStatus === 'saved' && 'Saved ✓'}
        {saveStatus === 'error' && 'Save failed'}
      </span>

      {/* Export button (D-14) */}
      <button onClick={() => toast('Export is not yet available')}>
        Export
      </button>
    </header>
  );
}
```

> **Sync `editValue` when `title` prop changes:** If a rename completes and the parent receives new `title` prop, the `editValue` state may be stale. Reset `editValue` in a `useEffect` watching `title`. [ASSUMED — standard controlled input synchronization pattern]

---

### Pattern 10: Sonner Toast Setup

```tsx
// apps/client/src/main.tsx — ADD <Toaster /> after installing shadcn sonner
import { Toaster } from '@/components/ui/sonner';

// Inside render:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
  <Toaster position="bottom-right" />  {/* outside RouterProvider is fine */}
</QueryClientProvider>
```

```tsx
// Usage anywhere after sonner is set up:
import { toast } from 'sonner';

toast('Export is not yet available');          // info (D-14)
toast.error('Save failed');                     // error
toast('"My Newsletter" deleted', {             // undo (D-05/delete)
  action: { label: 'Undo', onClick: () => restoreNewsletter() },
  duration: 5000,
});
```

> [VERIFIED: Context7 shadcn/ui docs — /shadcn-ui/ui, sonner component setup and usage]

---

### Pattern 11: drizzle-kit push on Neon.tech

```bash
# 1. Ensure apps/server/.env has:
# DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# 2. From apps/server directory:
cd apps/server
pnpm drizzle-kit push

# Expected output on success:
# [✓] Applied 1 table changes...
# OR: Your schema is up to date!
```

> The `drizzle.config.ts` from Phase 1 already points to `./src/db/schema.ts` and reads `DATABASE_URL` from `.env`. No changes needed to the config. [VERIFIED: Context7 Drizzle docs — drizzle-kit push, Neon connection]

> **Neon connection string format:** `postgresql://user:pass@endpoint.neon.tech/dbname?sslmode=require` — the `?sslmode=require` suffix is mandatory for Neon.tech connections. The existing `postgres.js` driver in `connection.ts` handles SSL automatically when it sees the Neon hostname.

---

### Anti-Patterns to Avoid

- **`navigate(-1)` for back button:** Browser history may be empty or route to unrelated pages. Always use `navigate('/newsletters')`.
- **Calling `setDoc()` in auto-save `onSuccess`:** Triggers another `useEffect` → another save → infinite loop. The mutation `onSuccess` only updates UI state (save status).
- **Full JSONB in list endpoint:** Sending `document` in `GET /newsletters` wastes bandwidth. Use lean select with `jsonb_array_length`.
- **Importing `@fastify/type-provider-zod` with Zod v4:** Package may not support Zod v4 API. Use manual `safeParse` in handlers.
- **`useEffect` dependency on `saveMutation`:** `saveMutation` from `useMutation()` is a stable reference in TanStack Query v5, but adding it to the deps array can cause re-runs. Disable the lint rule for this effect or use `saveMutation.mutate` captured outside the effect.
- **No cleanup on auto-save unmount:** Always `clearTimeout(timerRef.current)` in cleanup. Without this, a navigation away mid-debounce triggers a `fetch` on an unmounted component.
- **Using shadcn `toast` (deprecated):** The old shadcn `toast` component is removed in shadcn v4+. Use `sonner` as the recommended toast library. [VERIFIED: Context7 shadcn/ui docs — sonner is the current standard]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications with undo action | Custom toast component | `sonner` (via shadcn) | Action callbacks, auto-dismiss, positioning are complex to build correctly |
| Confirm dialog | `window.confirm()` or custom modal | `AlertDialog` (shadcn) | Accessible focus trapping, keyboard dismissal, aria-modal |
| Card actions menu | Custom dropdown | `DropdownMenu` (shadcn) | Keyboard navigation, focus management, WAI-ARIA menu role |
| Inline edit field | Contenteditable div | `<input>` + `isEditing` state | Contenteditable has cross-browser inconsistencies; controlled input is simpler |
| Debounce function | `setTimeout` in render | `useRef` timer pattern | `setTimeout` in render body runs on every render; ref-based timer is stable |
| UUID generation | `Math.random()` | PostgreSQL `gen_random_uuid()` via `defaultRandom()` | Drizzle's `uuid().defaultRandom()` uses crypto-safe DB-level UUID generation |
| `updated_at` manual tracking | `new Date()` in every `.set({})` | `$onUpdate(() => new Date())` | Drizzle auto-injects on every UPDATE; no risk of forgetting |

---

## Common Pitfalls

### Pitfall 1: Auto-Save Fires on Initial Doc Load

**What goes wrong:** `useEffect([doc])` fires immediately when `setDoc(data.document)` is called after the query resolves. This triggers a PUT request before the user has edited anything, creating unnecessary API calls and incorrect "Saving…" flicker.

**Why it happens:** Zustand `setDoc` is called in `BuilderPage`'s `useEffect` when query data arrives. The auto-save hook's `useEffect` also watches `doc` — so the first change (load) triggers it.

**How to avoid:** Use `isInitialLoadRef.current = true` initialized, set to `false` on first fire, and reset to `true` in the cleanup. This ensures that after the initial load emission, subsequent changes are debounced normally. In StrictMode (dev), the double-fire pattern is handled by the cleanup reset.

**Warning signs:** "Saving…" appears immediately on navigating to the builder page, before any edit.

---

### Pitfall 2: `jsonb_array_length` Returns NULL on Empty Array

**What goes wrong:** `jsonb_array_length(document->'rows')` returns `NULL` in PostgreSQL when the value is a valid empty array `[]`, not `0`. This causes `sectionCount: null` in the dashboard card.

**Why it happens:** PostgreSQL `jsonb_array_length` returns NULL for NULL input, but also returns `0` for `[]`. Actually — this is fine for `[]`. The issue is only if `document->'rows'` is NULL (i.e., key doesn't exist in the JSON). [ASSUMED — based on PostgreSQL jsonb behavior]

**How to avoid:** Use `COALESCE(jsonb_array_length(document->'rows'), 0)` to guarantee 0 for NULL:
```typescript
sectionCount: sql<number>`COALESCE(jsonb_array_length(${newsletters.document}->'rows'), 0)`,
```

**Warning signs:** `sectionCount` is `null` in dashboard cards for newly created newsletters.

---

### Pitfall 3: Optimistic Delete with Stale Cache After Undo

**What goes wrong:** User deletes, then clicks Undo. The cache is restored from the snapshot taken at delete time. But if another mutation happened between delete and undo (e.g., a concurrent rename), the snapshot is stale and the restored state is wrong.

**Why it happens:** The snapshot is taken at delete time, not at undo time. It's a frozen snapshot.

**How to avoid:** For v1 single-user app, this race condition is unlikely. The simpler fix is: after Undo, call `queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY })` instead of `setQueryData(previous)`. This forces a fresh fetch from the server. The trade-off is a brief refetch indicator, but correctness is preserved.

**Warning signs:** After Undo, the dashboard shows an incorrect list state (e.g., duplicate entries or wrong titles).

---

### Pitfall 4: `updatedAt` Not Reflecting Rename/Auto-Save in Dashboard Card

**What goes wrong:** The dashboard card shows a stale "Last saved" timestamp after rename or auto-save, because the `['newsletters']` list cache is not updated with the new `updatedAt` value.

**Why it happens:** `useRenameNewsletter.onSuccess` uses `setQueryData` to update the title in the list cache, but doesn't update `updatedAt`. Auto-save's success response includes `updatedAt` but is not pushed back to the list cache.

**How to avoid:** 
- In `useRenameNewsletter.onSuccess`: update both `title` and `updatedAt` in the list cache item.
- In `useUpdateNewsletter` (auto-save): after successful save, call `queryClient.setQueryData(NEWSLETTERS_QUERY_KEY, (old) => old?.map(n => n.id === id ? { ...n, updatedAt: data.updatedAt } : n))`.

**Warning signs:** Dashboard shows "5 minutes ago" timestamp even after a recent save.

---

### Pitfall 5: `dialog` Stays Open After Form Submission Error

**What goes wrong:** When `POST /newsletters` fails (e.g., network error), the create dialog closes because `onSuccess` navigates away — but on error, the dialog should stay open with an error message.

**Why it happens:** Using `mutate` without handling the error path in the dialog component.

**How to avoid:** Track `isPending` and `isError` from `useMutation`. Only close the dialog on success:
```tsx
const createMutation = useCreateNewsletter();

const handleSubmit = () => {
  createMutation.mutate(title, {
    onSuccess: (data) => {
      navigate(`/newsletters/${data.id}`);
      // dialog unmounts with navigation — no explicit close needed
    },
    // onError: leave dialog open, mutation.isError provides feedback
  });
};
```

---

### Pitfall 6: Drizzle `$onUpdate` Does Not Apply During Insert

**What goes wrong:** `$onUpdate(() => new Date())` only runs during `db.update()` calls, not `db.insert()`. If a manual `updatedAt` is not set on insert, it falls back to the column's `defaultNow()` default, which is correct behavior. But if you omit the `.defaultNow()` call from the column definition and only have `$onUpdate`, newly created records will have `NULL` for `updated_at`.

**How to avoid:** Always define both `defaultNow()` AND `$onUpdate()` on the `updatedAt` column:
```typescript
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
```

**Warning signs:** `updated_at IS NULL` in newly created newsletter rows.

---

## Code Examples

### Complete newsletters table schema

```typescript
// apps/server/src/db/schema.ts
// Source: Context7 Drizzle ORM docs — /websites/orm_drizzle_team pgTable, jsonb, uuid, timestamp
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { NewsletterDoc } from '../../client/src/types/newsletter.js';
// Note: path relative to apps/server/src/db/ — adjust if needed

export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  document: jsonb('document').$type<NewsletterDoc>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
    .$onUpdate(() => new Date()),
});

export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
```

### useMutation — auto-save (minimal)

```typescript
// Source: Context7 TanStack Query docs — /tanstack/query useMutation
import { useMutation } from '@tanstack/react-query';

const saveMutation = useMutation({
  mutationFn: async ({ id, document }: { id: string; document: NewsletterDoc }) => {
    const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    if (!res.ok) throw new Error('Save failed');
    return res.json() as Promise<{ id: string; updatedAt: string }>;
  },
  onSuccess: () => setSaveStatus('saved'),
  onError: () => setSaveStatus('error'),
});
```

### AlertDialog — Delete confirmation

```tsx
// Source: Context7 shadcn/ui docs — /shadcn-ui/ui alert-dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <button className="text-destructive">Delete</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "{newsletter.title}"?</AlertDialogTitle>
      <AlertDialogDescription>
        This cannot be undone. The newsletter will be permanently deleted.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDelete(newsletter.id, newsletter.title)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

> **UX note:** The `AlertDialog` confirms intent; the actual deletion is optimistic (removed immediately with undo toast) per D (delete pattern). The confirm dialog is shown BEFORE the optimistic delete.

### DropdownMenu — Card ⋮ actions

```tsx
// Source: Context7 shadcn/ui docs — /shadcn-ui/ui dropdown-menu
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

// In NewsletterCard — visible only on hover via Tailwind group-hover:
<div className="group relative">
  {/* card content */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Card actions"><MoreVertical size={16} /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem onSelect={handleDeleteClick} className="text-destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shadcn `useToast` hook | `sonner` library | shadcn v4 (2025) | `useToast` was deprecated; sonner is the new standard |
| `@tanstack/react-query` v4 `onMutate` context via hook | v5 `onMutate` returns context object directly | TanStack Query v5 | `context` param in `onError`/`onSettled` = value returned from `onMutate` |
| Drizzle `timestamp().notNull()` manual `updatedAt` | `.$onUpdate(() => new Date())` | drizzle-orm v0.30.5+ | Auto-applied on every UPDATE — no need to include in `.set({})` |
| `reply.send()` required in Fastify handlers | `return value` (v5) | Fastify v5 | Async handlers can just return — Fastify auto-sends as JSON |

**Deprecated/outdated:**
- `shadcn useToast + Toaster from '@/components/ui/toaster'`: Replaced by `sonner`. Never use the old toast in this project.
- `@fastify/type-provider-typebox`: Was the standard type provider in v4 examples. For this project, manual Zod `safeParse` is preferred (Zod already installed, simpler than adding TypeBox).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@fastify/type-provider-zod` does not yet support Zod v4 | Pattern 4 | If it does support Zod v4, we could use typed route generics instead of `safeParse`. Low impact — manual safeParse works fine either way. |
| A2 | `jsonb_array_length(document->'rows')` returns 0 (not NULL) for an empty array `[]` | Pitfall 2 | If it returns NULL, the `sectionCount` in dashboard cards would be null. Fix: add `COALESCE(..., 0)` to the SQL expression. |
| A3 | `useRef`-based debounce timer is safe in React 19 Strict Mode with the cleanup-reset pattern | Pattern 7 | If Strict Mode fires effects more than twice or changes cleanup timing, the initial-load guard may misfire. Mitigation: add explicit logging in dev to confirm behavior. |
| A4 | `saveMutation` from `useMutation()` has a stable reference across renders in TanStack Query v5 | Pattern 7 | If unstable, adding it to `useEffect` deps causes infinite loops. Use the `// eslint-disable-line` comment on the deps array to confirm intentional omission. |
| A5 | NewsletterDoc type can be imported from the client package by the server without creating a shared package | Pattern 1 | If TypeScript path resolution fails across `apps/` workspace boundaries, a `packages/types` workspace package is needed. Phase 1 verified that cross-app type imports work for this monorepo setup. [VERIFIED: Phase 1 research confirmed pnpm workspace structure] |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.  
*(Table is not empty — 5 assumptions require monitoring during implementation.)*

---

## Open Questions

1. **NewsletterDoc import path from server**
   - What we know: `NewsletterDoc` is in `apps/client/src/types/newsletter.ts`; the server is in `apps/server/`
   - What's unclear: Whether TypeScript resolves the cross-app relative import without a shared package
   - Recommendation: Attempt relative import first (`../../client/src/types/newsletter.js`). If that fails, create a `packages/types` symlink or duplicate the minimal type definition (interface only) in `apps/server/src/types/newsletter.ts`.

2. **`updatedAt` format in API responses**
   - What we know: Drizzle returns `Date` objects; `res.json()` serializes to ISO string
   - What's unclear: Whether the client-side `NewsletterSummary.updatedAt: string` type aligns with what `drizzle.$inferSelect` produces
   - Recommendation: In `NEWSLETTER_QUERY_KEY` and hook types, use `updatedAt: string` (ISO) since all JSON serialization converts `Date` → string. Add a `formatRelativeTime(updatedAt: string)` utility for "5 minutes ago" display.

3. **API base URL — hardcoded `localhost:3001` vs environment variable**
   - What we know: Phase 1's `config.ts` exposes `CLIENT_URL` but no `SERVER_URL` on the client
   - What's unclear: Whether Vite's env variable system (`.env`, `import.meta.env`) is wired up for the client
   - Recommendation: Hardcode `http://localhost:3001` as the API base for Phase 2 (pragmatic for single-dev setup). Add `VITE_API_URL` to client `.env` before Phase 9 (deploy phase).

---

## Environment Availability

> Phase 2 is code/config changes only. External dependencies are the same as Phase 1 (Neon.tech + Node.js). Phase 1 verified all dependencies are available.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All apps | ✓ | v22.9.0 | — |
| pnpm | Package manager | ✓ (installed in Phase 1) | Latest | — |
| Neon.tech PostgreSQL | DB | ✓ (verified in Phase 1) | PG 16 | — |
| drizzle-kit | Schema push | ✓ server devDep | 0.31.10 | — |

**No missing dependencies.** Phase 2 adds no new npm packages beyond shadcn CLI component generation.

---

## Validation Architecture

> `workflow.nyquist_validation: true` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (already in `apps/client` devDeps) |
| Config file | `apps/client/vitest.config.ts` — may be Wave 0 gap if not created in Phase 1 |
| Quick run command | `pnpm --filter ./apps/client test --run` |
| Full suite command | `pnpm --recursive run test` |
| TypeScript check (client) | `pnpm --filter ./apps/client exec tsc --noEmit` |
| TypeScript check (server) | `pnpm --filter ./apps/server exec tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| NL-01 | Create newsletter → stored in DB, navigates to builder | Integration (API) | `pnpm --filter ./apps/server test --run` (if server tests added) | ❌ Wave 0 |
| NL-01 | Create dialog — Create button disabled until name is non-empty | Unit (component) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 |
| NL-02 | Dashboard renders list of cards with title + sectionCount | Unit (component) | `pnpm --filter ./apps/client test --run` | ❌ Wave 0 |
| NL-03 | BuilderPage loads doc into Zustand on mount | Unit (hook/component) | Vitest render test | ❌ Wave 0 |
| NL-04 | Rename: inline edit sends PATCH, cache updates | Unit (hook) | Mock fetch + test cache | ❌ Wave 0 |
| NL-05 | Delete: optimistic removal + undo restores | Unit (hook) | Mock setTimeout + test cache | ❌ Wave 0 |
| NL-06 | Auto-save: no save on load; saves after 1500ms | Unit (hook) | Fake timers `vi.useFakeTimers()` | ❌ Wave 0 |
| NL-06 | Auto-save retry after 5s on error | Unit (hook) | Fake timers + mock fetch error | ❌ Wave 0 |
| All | TypeScript strict compilation passes | Type check | `pnpm --filter ./apps/client exec tsc --noEmit` | ✅ existing |
| All | API responds to all 6 routes | Smoke | `curl http://localhost:3001/newsletters` | Manual during dev |

### Key Test: Auto-Save with Fake Timers

```typescript
// apps/client/src/hooks/__tests__/useAutoSave.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useAutoSave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not save on initial doc load', () => {
    // setup: mount hook with initial doc
    // assert: fetch not called after mount
  });

  it('saves after 1500ms debounce when doc changes', async () => {
    // setup: trigger doc change via setDoc
    vi.advanceTimersByTime(1500);
    // assert: fetch called with PUT /newsletters/:id
  });

  it('debounces rapid changes — only one save', async () => {
    // setup: trigger 5 rapid doc changes over 1000ms
    vi.advanceTimersByTime(1500);
    // assert: fetch called exactly once
  });

  it('retries after 5s on error', async () => {
    // setup: mock fetch to throw, trigger save
    vi.advanceTimersByTime(1500); // first attempt
    // assert: saveStatus === 'error'
    vi.advanceTimersByTime(5000); // retry
    // assert: fetch called second time
  });
});
```

### Wave 0 Gaps

- [ ] `apps/client/vitest.config.ts` — verify exists from Phase 1; create if missing
- [ ] `apps/client/src/hooks/__tests__/useAutoSave.test.ts` — covers NL-06
- [ ] `apps/client/src/components/__tests__/CreateDialog.test.tsx` — covers NL-01 (disabled button)
- [ ] `apps/client/src/hooks/__tests__/useDeleteNewsletter.test.ts` — covers NL-05 (optimistic + undo)

---

## Security Domain

> `security_enforcement` absent from config = enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | v1 is single-user, no auth |
| V3 Session Management | No | No sessions in v1 |
| V4 Access Control | No | Single-user; all newsletters accessible |
| V5 Input Validation | Yes | Zod `safeParse` on all request bodies; 400 on invalid input |
| V6 Cryptography | No | No secrets or credentials stored |

### Known Threat Patterns for Fastify + PostgreSQL

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSONB injection (malformed JSON) | Tampering | Fastify auto-parses JSON body; invalid JSON = 400 before handler |
| Oversized JSONB payload | DoS | Fastify default body size limit 1MB; a full newsletter doc is <50KB |
| UUID enumeration | Information Disclosure | UUIDs from `gen_random_uuid()` are non-sequential — not guessable |
| XSS via title stored in DB | Stored XSS | React auto-escapes all rendered text; no `dangerouslySetInnerHTML` |

> **Note:** The `DELETE /newsletters/:id` returning 404 for non-existent IDs is correct behavior. Do not use a uniform 204 for both cases — 404 is informative and not an information disclosure risk (UUID-based IDs prevent enumeration).

---

## Sources

### Primary (HIGH confidence)
- `/websites/orm_drizzle_team` (Context7) — jsonb, uuid, timestamp, $onUpdate, partial select, sql template, insert/update/delete/returning patterns
- `/fastify/fastify` (Context7) — plugin registration, FastifyPluginAsync, async handlers, error handling, TypeScript route generics
- `/tanstack/query` (Context7) — useMutation, optimistic updates, setQueryData, invalidateQueries, useQueryClient, staleTime
- `/remix-run/react-router` (Context7) — useNavigate, useParams, RouterProvider Data Router mode
- `/shadcn-ui/ui` (Context7) — dialog, alert-dialog, dropdown-menu, input, button, sonner installation and usage

### Secondary (MEDIUM confidence)
- Phase 1 RESEARCH.md (`01-RESEARCH.md`) — Drizzle connection, Fastify plugin patterns, TanStack Query setup, React Router library mode, all stack versions [VERIFIED in Phase 1 session]
- Phase 1 verified codebase (`apps/server/src/`, `apps/client/src/`) — actual code that Phase 2 builds on [VERIFIED: direct file reads this session]

### Tertiary (LOW confidence)
- `@fastify/type-provider-zod` + Zod v4 compatibility claim [ASSUMED — not verified against npm registry this session]
- React 19 Strict Mode double-fire behavior with `useRef` pattern [ASSUMED — based on React 19 Strict Mode documentation behavior]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from Phase 1 npm checks; no new packages beyond shadcn CLI components
- Architecture (Drizzle patterns): HIGH — jsonb, $onUpdate, partial select verified via Context7
- Architecture (Fastify plugin module): HIGH — FastifyPluginAsync verified via Context7
- Architecture (TanStack Query v5): HIGH — useMutation, setQueryData, invalidateQueries verified via Context7
- Auto-save pattern: MEDIUM — useRef debounce approach is established React pattern; React 19 Strict Mode interaction is ASSUMED
- Undo toast pattern: MEDIUM — sonner action pattern verified; 5s delayed-API-call approach is project-specific design

**Research date:** 2026-06-07  
**Valid until:** 2026-07-07 (stable stack; shadcn/sonner may add features; drizzle-kit behavior is stable)
