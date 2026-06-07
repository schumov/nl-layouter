# Phase 2: Newsletter CRUD & Dashboard — Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 16 new/modified files
**Analogs found:** 10 / 16 (6 files have no close codebase analog — they are first-of-kind; use RESEARCH.md patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/server/src/db/schema.ts` | model | CRUD | `apps/server/src/db/connection.ts` | role-match (same db/ layer) |
| `apps/server/src/routes/newsletters.ts` | controller | CRUD | `apps/server/src/index.ts` (health route) | partial (same Fastify, diff scope) |
| `apps/server/src/index.ts` | config/bootstrap | request-response | itself (modification) | exact |
| `apps/client/src/hooks/useNewsletters.ts` | hook | request-response | `apps/client/src/store/useNewsletterStore.ts` | partial (state layer, diff data flow) |
| `apps/client/src/hooks/useCreateNewsletter.ts` | hook | CRUD | `apps/client/src/store/useNewsletterStore.ts` | partial |
| `apps/client/src/hooks/useUpdateNewsletter.ts` | hook | CRUD | `apps/client/src/store/useNewsletterStore.ts` | partial |
| `apps/client/src/hooks/useRenameNewsletter.ts` | hook | CRUD | `apps/client/src/store/useNewsletterStore.ts` | partial |
| `apps/client/src/hooks/useDeleteNewsletter.ts` | hook | CRUD | `apps/client/src/store/useNewsletterStore.ts` | partial |
| `apps/client/src/hooks/useAutoSave.ts` | hook | event-driven | `apps/client/src/store/useNewsletterStore.ts` | partial |
| `apps/client/src/pages/DashboardPage.tsx` | component | CRUD | none | no analog |
| `apps/client/src/components/dashboard/NewsletterCard.tsx` | component | CRUD | none | no analog |
| `apps/client/src/components/dashboard/CreateNewsletterDialog.tsx` | component | CRUD | none | no analog |
| `apps/client/src/pages/BuilderPage.tsx` | component | request-response | none | no analog |
| `apps/client/src/components/builder/BuilderHeader.tsx` | component | event-driven | none | no analog |
| `apps/client/src/main.tsx` | config/bootstrap | request-response | itself (modification) | exact |
| `apps/client/src/index.css` | config | — | itself (modification) | exact |

---

## Pattern Assignments

### `apps/server/src/db/schema.ts` (model, CRUD)

**Analog:** `apps/server/src/db/connection.ts` — same db/ layer, shows drizzle-orm import conventions and ESM `.js` extensions.

**Imports pattern** (connection.ts lines 1-2):
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
```
→ New schema.ts replaces these with pg-core column helpers:
```typescript
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type { NewsletterDoc } from '../../client/src/types/newsletter.js';
// type-only import — safe cross-package; erased at runtime (no circular dep at runtime)
```

**Core pattern** — full table definition:
```typescript
export const newsletters = pgTable('newsletters', {
  id:        uuid('id').primaryKey().defaultRandom(),
  title:     text('title').notNull(),
  document:  jsonb('document').$type<NewsletterDoc>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
               .$onUpdate(() => new Date()),   // auto-set on every db.update()
});

// Always export both inferred types — used in route handlers for type safety
export type Newsletter    = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
```

**Critical rules:**
- `updatedAt` MUST have **both** `.defaultNow()` AND `.$onUpdate()` — `$onUpdate` alone leaves `NULL` on INSERT (Pitfall 6)
- `$type<NewsletterDoc>()` is a TypeScript-only annotation; Drizzle stores/retrieves it as plain JSONB
- Import path from `apps/server/src/db/schema.ts` to client types: `../../client/src/types/newsletter.js` (ESM `.js` suffix required in all server TypeScript files)

---

### `apps/server/src/routes/newsletters.ts` (controller, CRUD)

**Analog:** `apps/server/src/index.ts` — shows Fastify handler shape, reply codes, async handler pattern.

**Imports pattern** (from research Pattern 4 — no closer analog exists in codebase):
```typescript
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';       // .js suffix — ESM rule
import { newsletters } from '../db/schema.js';  // .js suffix — ESM rule
import type { NewsletterDoc } from '../../../client/src/types/newsletter.js';
```

**Health-route pattern to copy** (index.ts lines 21-38) — shows Fastify handler structure:
```typescript
server.get(
  '/health',
  {
    schema: {
      response: { 200: { type: 'object', properties: { status: { type: 'string' } }, required: ['status'] } },
    },
  },
  async () => {
    return { status: 'ok' };
  }
);
```
→ Newsletter routes DROP the JSON Schema block (manual Zod `safeParse` replaces it — see Validation pattern) and follow `fastify.METHOD('/path', async (request, reply) => { ... })`.

**Zod validation pattern** (from config.ts lines 6-15 — manual `.parse()` / `.safeParse()` — same v4 syntax):
```typescript
// config.ts uses parse() for fail-fast at startup:
export const config = EnvSchema.parse(process.env);

// Routes use safeParse() so handler can return 400 instead of throwing:
const CreateSchema  = z.object({ title: z.string().min(1) });
const UpdateDocSchema = z.object({ document: z.unknown() });
const RenameSchema  = z.object({ title: z.string().min(1) });

const parsed = CreateSchema.safeParse(request.body);
if (!parsed.success) return reply.code(400).send({ error: 'title is required' });
```

**Lean list select pattern** (Drizzle sql`` template literal — research Pattern 2):
```typescript
// COALESCE prevents null when rows array exists but is empty
const rows = await db.select({
  id:           newsletters.id,
  title:        newsletters.title,
  updatedAt:    newsletters.updatedAt,
  sectionCount: sql<number>`COALESCE(jsonb_array_length(${newsletters.document}->'rows'), 0)`,
}).from(newsletters).orderBy(desc(newsletters.updatedAt));
```

**Error handling pattern** (inline per-route — mirrors index.ts inline style):
```typescript
// 404 check after get-by-id:
const [row] = await db.select().from(newsletters).where(eq(newsletters.id, id));
if (!row) return reply.code(404).send({ error: 'Newsletter not found' });

// 404 check after update/delete:
if (!updated) return reply.code(404).send({ error: 'Newsletter not found' });
if (!deleted.length) return reply.code(404).send({ error: 'Newsletter not found' });
```

**Plugin module wrapper** (allows `server.register()` in index.ts):
```typescript
const newsletterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/newsletters', async (_req, _reply) => { ... });
  fastify.post('/newsletters', async (request, reply) => { ... });
  fastify.get('/newsletters/:id', async (request, reply) => { ... });
  fastify.put('/newsletters/:id', async (request, reply) => { ... });
  fastify.patch('/newsletters/:id', async (request, reply) => { ... });
  fastify.delete('/newsletters/:id', async (request, reply) => { ... });
};

export default newsletterRoutes;
```

**Params extraction** (Fastify v5 — no generic on `request.params` at call site):
```typescript
const { id } = request.params as { id: string };
```

**INITIAL_DOC constant** (decision D-07 — define at top of routes file):
```typescript
const INITIAL_DOC: NewsletterDoc = {
  header:       { presetId: 'infineon-default', variables: {} },
  footer:       { presetId: 'infineon-default', variables: {} },
  rows:         [],
  globalStyles: {
    fontFamily:       'Arial, sans-serif',
    backgroundColor:  '#f4f4f4',
    contentWidth:     600,
    primaryColor:     '#0066cc',
  },
};
```

---

### `apps/server/src/index.ts` (modification — register plugin)

**Analog:** itself — add two lines before `server.listen()`.

**Existing plugin registration pattern** (index.ts lines 11-17):
```typescript
await server.register(cors, {
  origin: config.CLIENT_URL,
  credentials: true,
});
await server.register(cookie);
```
→ Add newsletter routes in the same style:
```typescript
import newsletterRoutes from './routes/newsletters.js';  // top of file with other imports
// ...
await server.register(newsletterRoutes);  // after cookie registration, before server.listen()
```

---

### `apps/client/src/hooks/useNewsletters.ts` (hook, request-response)

**Analog:** `apps/client/src/store/useNewsletterStore.ts` — shows TypeScript interface pattern for state/actions separation. No TanStack Query hook exists yet.

**Interface separation pattern from store** (lines 21-43):
```typescript
interface NewsletterState { ... }
interface NewsletterActions { ... }
```
→ Hooks export typed interfaces for their data shapes:
```typescript
export interface NewsletterSummary {
  id:           string;
  title:        string;
  updatedAt:    string;   // ISO string from JSON serialization of Date
  sectionCount: number;
}

// Stable query key constants — import in all mutation hooks that invalidate this query
export const NEWSLETTERS_QUERY_KEY    = ['newsletters'] as const;
export const NEWSLETTER_QUERY_KEY     = (id: string) => ['newsletter', id] as const;
```

**Import pattern** (TanStack Query v5):
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
```

**Core query hook pattern** (research Pattern 5):
```typescript
export function useNewsletters() {
  return useQuery<NewsletterSummary[]>({
    queryKey: NEWSLETTERS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/newsletters');
      if (!res.ok) throw new Error('Failed to fetch newsletters');
      return res.json() as Promise<NewsletterSummary[]>;
    },
    staleTime: 0,           // Always refetch on mount — mutations invalidate this key
  });
}

export function useNewsletter(id: string) {
  return useQuery({
    queryKey: NEWSLETTER_QUERY_KEY(id),
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`);
      if (!res.ok) throw new Error('Newsletter not found');
      return res.json() as Promise<Newsletter>;   // Newsletter = full row with document
    },
    staleTime: 1000 * 60,  // 1 min — matches QueryClient global default from main.tsx
  });
}
```

**TanStack Query v5 critical syntax notes:**
- `useMutation` takes `{ mutationFn, onSuccess, onError }` — NOT `mutationKey` in options
- `queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY })` — object arg, not positional
- `queryClient.setQueryData<T>(key, updaterFn)` — generic type on method, not separate call

---

### `apps/client/src/hooks/useCreateNewsletter.ts` (hook, CRUD)

**Analog:** `apps/client/src/store/useNewsletterStore.ts` — shows mutation-action pattern.

**Import pattern:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEWSLETTERS_QUERY_KEY } from './useNewsletters.js';
// Note: in Vite/client TypeScript, .js extension is optional but be consistent
```

**Core mutation pattern:**
```typescript
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
      queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
    },
  });
}
```

**Usage pattern (D-06 — navigate on success):**
```typescript
// In CreateNewsletterDialog.tsx — use mutateAsync to get the returned id
const newsletter = await createMutation.mutateAsync(title);
navigate(`/newsletters/${newsletter.id}`);
```

---

### `apps/client/src/hooks/useUpdateNewsletter.ts` (hook, CRUD — auto-save transport)

**Analog:** same as useCreateNewsletter — `useMutation` pattern.

**Core pattern** (PUT replaces full document):
```typescript
export function useUpdateNewsletter(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: NewsletterDoc) => {
      const res = await fetch(`http://localhost:3001/newsletters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json() as Promise<{ id: string; updatedAt: string }>;
    },
    onSuccess: (data) => {
      // Update updatedAt in the list cache — prevents stale timestamp (Pitfall 4)
      queryClient.setQueryData<NewsletterSummary[]>(
        NEWSLETTERS_QUERY_KEY,
        (old) => old?.map((n) => n.id === id ? { ...n, updatedAt: data.updatedAt } : n) ?? []
      );
    },
    // onSuccess must NEVER call setDoc() — would trigger infinite save loop (Anti-pattern)
  });
}
```

---

### `apps/client/src/hooks/useRenameNewsletter.ts` (hook, CRUD)

**Core pattern** (PATCH + dual cache update — research Pattern 6):
```typescript
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
      return res.json() as Promise<{ id: string; title: string; updatedAt: string }>;
    },
    onSuccess: (data) => {
      // 1. Update title + updatedAt in the list cache (prevents Pitfall 4)
      queryClient.setQueryData<NewsletterSummary[]>(
        NEWSLETTERS_QUERY_KEY,
        (old) => old?.map((n) => n.id === id ? { ...n, title: data.title, updatedAt: data.updatedAt } : n) ?? []
      );
      // 2. Update builder detail cache
      queryClient.setQueryData(NEWSLETTER_QUERY_KEY(id), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        return { ...(old as object), title: data.title, updatedAt: data.updatedAt };
      });
    },
  });
}
```

**Why `setQueryData` not `invalidateQueries` for rename:** `setQueryData` is synchronous — title updates instantly in both dashboard and BuilderHeader. `invalidateQueries` causes a brief refetch flicker. Use `setQueryData` when the server response already contains the updated value.

---

### `apps/client/src/hooks/useDeleteNewsletter.ts` (hook, CRUD)

**Core pattern** (optimistic delete with 5-second undo window — research Pattern 5):
```typescript
export function useDeleteNewsletter() {
  const queryClient = useQueryClient();

  const handleDelete = (id: string, title: string) => {
    // 1. Snapshot for rollback
    const previous = queryClient.getQueryData<NewsletterSummary[]>(NEWSLETTERS_QUERY_KEY);

    // 2. Optimistic removal
    queryClient.setQueryData<NewsletterSummary[]>(
      NEWSLETTERS_QUERY_KEY,
      (old) => old?.filter((n) => n.id !== id) ?? []
    );

    let undone = false;
    const timerId = setTimeout(async () => {
      if (undone) return;
      try {
        const res = await fetch(`http://localhost:3001/newsletters/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
      } catch {
        queryClient.setQueryData(NEWSLETTERS_QUERY_KEY, previous);
        toast.error(`Failed to delete "${title}"`);
      }
    }, 5000);

    // 3. Toast with Undo action (Sonner — NOT shadcn deprecated toast)
    toast(`"${title}" deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          clearTimeout(timerId);
          // Invalidate instead of setQueryData(previous) to avoid stale-snapshot race (Pitfall 3)
          queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });
        },
      },
      duration: 5000,
    });
  };

  return { handleDelete };
}
```

**Import for Sonner toast:**
```typescript
import { toast } from 'sonner';   // NOT from '@/components/ui/sonner' — that's the Toaster component
```

---

### `apps/client/src/hooks/useAutoSave.ts` (hook, event-driven)

**This is Phase 2's most complex hook.** No codebase analog — closest pattern is useNewsletterStore's Zustand selector pattern.

**Zustand selector pattern from store** (lines 46, 53-56):
```typescript
// Store: creates stable selector
export const useNewsletterStore = create<NewsletterState & NewsletterActions>()(
  immer((set) => ({
    doc: null,
    setDoc: (doc) => set((state) => { state.doc = doc; }),
  }))
);
// Hooks: consume with granular selector to avoid full-state re-renders
const doc = useNewsletterStore((state) => state.doc);
```

**Core auto-save pattern** (research Pattern 7 — three invariants must hold):
```typescript
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNewsletterStore } from '../store/useNewsletterStore';
import type { NewsletterDoc } from '../types/newsletter';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(id: string) {
  const doc = useNewsletterStore((state) => state.doc);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Invariant 1: No save on initial doc load
  const isInitialLoadRef = useRef(true);
  // Timer refs — stable across renders, no re-run risk
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      // Invariant 2: NEVER call setDoc() here — infinite loop
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
    // Invariant 1: skip initial load; reset in cleanup for StrictMode double-fire
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return () => { isInitialLoadRef.current = true; };
    }
    if (!doc) return;

    // D-10: show "Saving…" only after first edit
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    timerRef.current = setTimeout(() => {
      saveMutation.mutate(doc);
    }, 1500);

    // Invariant 3: clean timer on unmount/re-run
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup ALL timers on final unmount
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

---

### `apps/client/src/pages/DashboardPage.tsx` (component, CRUD)

**No codebase analog** — first page component. Patterns derive from main.tsx (React 19 import style) and RESEARCH.md.

**React 19 import pattern** (main.tsx lines 10-16):
```tsx
import React from 'react'            // React 19: still needed for JSX in .tsx
import { useNavigate } from 'react-router'   // v7 library mode — NOT 'react-router-dom'
```

**Core page structure** (D-03/D-04 decisions):
```tsx
import { useNewsletters } from '../hooks/useNewsletters';
import { NewsletterCard } from '../components/dashboard/NewsletterCard';
import { CreateNewsletterDialog } from '../components/dashboard/CreateNewsletterDialog';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: newsletters, isPending, isError } = useNewsletters();

  if (isPending) return <div className="flex items-center justify-center h-screen">Loading…</div>;
  if (isError)   return <div>Error loading newsletters</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Newsletters</h1>
        <CreateNewsletterDialog />
      </div>

      {newsletters.length === 0 ? (
        // D-04: Empty state
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground">No newsletters yet</p>
          <CreateNewsletterDialog triggerLabel="Create your first newsletter" />
        </div>
      ) : (
        // D-03: Responsive grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsletters.map((nl) => (
            <NewsletterCard key={nl.id} newsletter={nl} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**cn() utility import** (from `apps/client/src/lib/utils.ts` line 1-5):
```typescript
import { cn } from '@/lib/utils';   // @ alias = src/ (vite.config.ts line 13)
```
Use `cn()` for conditional Tailwind class merging in all components.

---

### `apps/client/src/components/dashboard/NewsletterCard.tsx` (component, CRUD)

**No codebase analog** — first shadcn/ui component.

**Component prop typing pattern** (mirrors store's interface pattern from useNewsletterStore.ts lines 21-31):
```tsx
import type { NewsletterSummary } from '../../hooks/useNewsletters';

interface NewsletterCardProps {
  newsletter: NewsletterSummary;
}
```

**Core card structure** (D-01/D-02 decisions):
```tsx
import { useNavigate } from 'react-router';
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeleteNewsletter } from '../../hooks/useDeleteNewsletter';

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const navigate = useNavigate();
  const { handleDelete } = useDeleteNewsletter();

  return (
    // hover:shadow-md for hover affordance; group for showing ⋮ on hover (D-02)
    <div
      className="group relative rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/newsletters/${newsletter.id}`)}
    >
      {/* D-01: Title + timestamp + section count */}
      <h2 className="font-semibold truncate">{newsletter.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">
        {new Date(newsletter.updatedAt).toLocaleDateString()}
      </p>
      <p className="text-xs text-muted-foreground">
        {newsletter.sectionCount} section{newsletter.sectionCount !== 1 ? 's' : ''}
      </p>

      {/* D-02: ⋮ menu — visible on hover */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}  // prevent card click-through
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Card actions"><MoreVertical size={16} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/newsletters/${newsletter.id}`)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(newsletter.id, newsletter.title)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

---

### `apps/client/src/components/dashboard/CreateNewsletterDialog.tsx` (component, CRUD)

**No codebase analog** — first dialog component.

**Core dialog pattern** (D-05/D-06/Pitfall 5):
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateNewsletter } from '../../hooks/useCreateNewsletter';

interface CreateNewsletterDialogProps {
  triggerLabel?: string;
}

export function CreateNewsletterDialog({ triggerLabel = 'New Newsletter' }: CreateNewsletterDialogProps) {
  const [open, setOpen]   = useState(false);
  const [title, setTitle] = useState('');
  const navigate          = useNavigate();
  const createMutation    = useCreateNewsletter();

  const handleSubmit = () => {
    if (!title.trim()) return;
    createMutation.mutate(title.trim(), {
      onSuccess: (data) => {
        // D-06: navigate directly to builder — dialog unmounts with navigation
        navigate(`/newsletters/${data.id}`);
      },
      // Pitfall 5: on error, leave dialog open; mutation.isError provides feedback
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Newsletter</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Newsletter name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
        />
        {createMutation.isError && (
          <p className="text-sm text-destructive">Failed to create newsletter. Try again.</p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || createMutation.isPending}  // D-05: disabled until name non-empty
        >
          {createMutation.isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### `apps/client/src/pages/BuilderPage.tsx` (component, request-response)

**No codebase analog** — first builder page. Integrates useNewsletter, Zustand store, useAutoSave.

**Zustand store usage pattern** (from useNewsletterStore.ts lines 52-62):
```typescript
// Destructure only what you need — avoids full-state re-renders
const { setDoc, clearDoc } = useNewsletterStore();
```

**React Router params pattern** (from main.tsx route `/newsletters/:id` line 38):
```typescript
import { useParams } from 'react-router';
const { id } = useParams<{ id: string }>();
// id is string | undefined; use id! after confirming route structure
```

**Core page pattern** (research Pattern 7 — usage section):
```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNewsletter } from '../hooks/useNewsletters';
import { useNewsletterStore } from '../store/useNewsletterStore';
import { useAutoSave } from '../hooks/useAutoSave';
import BuilderHeader from '../components/builder/BuilderHeader';

export default function BuilderPage() {
  const { id }                       = useParams<{ id: string }>();
  const { data, isPending, isError } = useNewsletter(id!);
  const { setDoc, clearDoc }         = useNewsletterStore();
  const { saveStatus }               = useAutoSave(id!);

  // Load doc into Zustand when query resolves; clear on unmount (navigate back)
  useEffect(() => {
    if (data) setDoc(data.document);
    return () => clearDoc();
  }, [data, setDoc, clearDoc]);

  // D-10: No indicator during initial load — return null, not a spinner
  if (isPending) return null;
  if (isError)   return <div className="p-4 text-destructive">Error loading newsletter</div>;

  return (
    <div className="flex flex-col h-screen">
      <BuilderHeader id={id!} title={data?.title ?? ''} saveStatus={saveStatus} />
      {/* Phase 3 adds canvas here */}
      <main className="flex-1 bg-neutral-100" />
    </div>
  );
}
```

---

### `apps/client/src/components/builder/BuilderHeader.tsx` (component, event-driven)

**No codebase analog** — first header bar component. Uses inline edit pattern.

**Import pattern** (lucide-react — already installed):
```tsx
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SaveStatus } from '../../hooks/useAutoSave';
```

**Props interface** (mirrors store interface separation pattern):
```tsx
interface BuilderHeaderProps {
  id:         string;
  title:      string;
  saveStatus: SaveStatus;
}
```

**Core header pattern** (D-12/D-13/D-14 decisions — research Pattern 9):
```tsx
export default function BuilderHeader({ id, title, saveStatus }: BuilderHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const renameMutation = useRenameNewsletter(id);

  // Sync editValue when title prop changes (e.g., after rename resolves)
  useEffect(() => { setEditValue(title); }, [title]);

  const commitRename = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      renameMutation.mutate(trimmed);   // D-13: PATCH on blur or Enter
    }
  };

  return (
    <header className="flex items-center gap-4 h-14 px-4 border-b bg-white sticky top-0 z-10">
      {/* D-12: ← back arrow — absolute path, not navigate(-1) */}
      <button onClick={() => navigate('/newsletters')} aria-label="Back to dashboard">
        <ChevronLeft size={20} />
      </button>

      {/* D-13: Click-to-edit title */}
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }}
          className="flex-1 text-center font-semibold border-b border-primary outline-none bg-transparent"
        />
      ) : (
        <button
          onClick={() => { setEditValue(title); setIsEditing(true); }}
          className="flex-1 text-center font-semibold hover:underline truncate"
        >
          {title}
        </button>
      )}

      {/* D-10/D-11: Save status — idle shows nothing */}
      <span className={cn(
        'text-sm min-w-20 text-right transition-opacity',
        saveStatus === 'idle'   && 'opacity-0',
        saveStatus === 'saving' && 'text-muted-foreground',
        saveStatus === 'saved'  && 'text-green-600',
        saveStatus === 'error'  && 'text-destructive',
      )}>
        {saveStatus === 'saving' && 'Saving…'}
        {saveStatus === 'saved'  && 'Saved ✓'}
        {saveStatus === 'error'  && 'Save failed'}
      </span>

      {/* D-14: Export button — stub toast */}
      <button
        onClick={() => toast('Export is not yet available')}
        className="text-sm px-3 py-1 rounded border hover:bg-accent"
      >
        Export
      </button>
    </header>
  );
}
```

---

### `apps/client/src/main.tsx` (modification — routes + Toaster)

**Analog:** itself — two targeted modifications.

**Existing router pattern** (main.tsx lines 27-40):
```tsx
const router = createBrowserRouter([
  { path: '/', element: <div>...</div> },
  { path: '/newsletters', element: <div>...</div> },
  { path: '/newsletters/:id', element: <div>...</div> },
])
```
→ Replace placeholder `element` values with real page imports:
```tsx
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';

const router = createBrowserRouter([
  { path: '/', element: <DashboardPage /> },          // redirect or same as /newsletters
  { path: '/newsletters', element: <DashboardPage /> },
  { path: '/newsletters/:id', element: <BuilderPage /> },
])
```

**Existing QueryClientProvider wrapper** (main.tsx lines 45-50):
```tsx
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```
→ Add `<Toaster />` inside the wrapper (outside RouterProvider is fine):
```tsx
import { Toaster } from '@/components/ui/sonner';   // shadcn-generated component

<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
  <Toaster position="bottom-right" />
</QueryClientProvider>
```

---

### `apps/client/src/index.css` (modification — Infineon Blue token)

**Analog:** itself — add one token override inside the existing `:root` block.

**Existing token pattern** (index.css lines 43-77):
```css
@layer base {
  :root {
    --primary: oklch(0.205 0 0);           /* current: near-black */
    --primary-foreground: oklch(0.985 0 0);
    /* ... */
  }
}
```
→ Override `--primary` with Infineon Blue (#0066cc):
```css
@layer base {
  :root {
    /* Infineon Blue override — replaces shadcn default near-black primary */
    --primary: oklch(0.452 0.15 250);       /* #0066cc in oklch */
    --primary-foreground: oklch(0.985 0 0); /* white — already correct */
    /* All other tokens remain unchanged */
  }
}
```

**Tailwind v4 CSS-first rule** (index.css line 1):
```css
@import "tailwindcss";
/* DO NOT add a tailwind.config.js — v4 is configured entirely via CSS */
/* Token overrides go in @theme inline {} block or @layer base :root {} */
```

---

## Shared Patterns

### ESM `.js` Extension (Server TypeScript)

**Source:** `apps/server/src/index.ts` lines 4-5 and `apps/server/src/db/connection.ts`
**Apply to:** ALL server-side TypeScript import statements for local files

```typescript
// CORRECT — ESM requires .js extension even in TypeScript source
import { config } from './config.js';
import { db } from '../db/connection.js';
import { newsletters } from '../db/schema.js';
import newsletterRoutes from './routes/newsletters.js';

// WRONG — will fail at runtime in Node ESM
import { config } from './config';
```

Client-side `.tsx`/`.ts` files do NOT need `.js` extensions (Vite handles resolution).

---

### Zod v4 Syntax

**Source:** `apps/server/src/config.ts` lines 6-15
**Apply to:** All Zod schema definitions in server route handlers

```typescript
// CORRECT — Zod v4 syntax
z.string().min(1)
z.string().min(1, 'Error message')
z.coerce.number().default(3001)
z.enum(['development', 'production', 'test'])

// WRONG — Zod v3 syntax not available in v4
z.string().nonempty()  // removed in v4 — use .min(1) instead
```

---

### Path Alias `@/` (Client)

**Source:** `apps/client/vite.config.ts` lines 11-14
**Apply to:** All client-side component/utility imports

```typescript
// vite.config.ts defines: '@' → './src'
// Use in any client file:
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
// DO NOT use relative ../../lib/utils — prefer @ alias for readability
```

---

### Tailwind `cn()` for Conditional Classes

**Source:** `apps/client/src/lib/utils.ts` lines 1-5
**Apply to:** All React components with conditional Tailwind classes

```typescript
import { cn } from '@/lib/utils';

// Usage — clsx conditions + tailwind-merge for deduplication:
<div className={cn(
  'base-classes always-applied',
  condition && 'applied-when-true',
  variant === 'destructive' && 'text-destructive',
)} />
```

---

### TanStack Query v5 Cache Manipulation

**Source:** RESEARCH.md Pattern 5/6 (no existing hooks analog)
**Apply to:** All mutation hooks (`useCreateNewsletter`, `useRenameNewsletter`, `useUpdateNewsletter`, `useDeleteNewsletter`)

```typescript
const queryClient = useQueryClient();

// Invalidate (triggers refetch):
queryClient.invalidateQueries({ queryKey: NEWSLETTERS_QUERY_KEY });

// Direct cache update (synchronous, no refetch):
queryClient.setQueryData<NewsletterSummary[]>(
  NEWSLETTERS_QUERY_KEY,
  (old) => old?.map((n) => n.id === id ? { ...n, ...changes } : n) ?? []
);

// Snapshot for rollback:
const previous = queryClient.getQueryData<NewsletterSummary[]>(NEWSLETTERS_QUERY_KEY);
```

---

### Sonner Toast Import Convention

**Source:** RESEARCH.md Pattern 10 (after shadcn `sonner` install)
**Apply to:** `useDeleteNewsletter`, `BuilderHeader`, any component using toasts

```typescript
// Function — imported from sonner package directly:
import { toast } from 'sonner';

// Component — imported from shadcn-generated file (placed in main.tsx only):
import { Toaster } from '@/components/ui/sonner';
```

---

### React Router v7 Library Mode Import

**Source:** `apps/client/src/main.tsx` lines 12-13
**Apply to:** All client files using navigation or params

```typescript
// CORRECT — library mode imports (NOT 'react-router-dom')
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { useNavigate, useParams } from 'react-router';

// WRONG — v5 API, not installed
import { BrowserRouter } from 'react-router-dom';
```

---

## No Analog Found

Files with no close match in the existing codebase — use RESEARCH.md patterns instead:

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/client/src/pages/DashboardPage.tsx` | component | CRUD | First page component in project |
| `apps/client/src/components/dashboard/NewsletterCard.tsx` | component | CRUD | First shadcn/ui component in project |
| `apps/client/src/components/dashboard/CreateNewsletterDialog.tsx` | component | CRUD | First dialog component in project |
| `apps/client/src/pages/BuilderPage.tsx` | component | request-response | First builder page in project |
| `apps/client/src/components/builder/BuilderHeader.tsx` | component | event-driven | First sticky bar component in project |
| `apps/client/src/hooks/useAutoSave.ts` | hook | event-driven | First debounced effect hook; no lodash.debounce — use `useRef` timer pattern |

All six use patterns from RESEARCH.md Patterns 5-9. The shared TypeScript interface style (state/actions separation, typed props interfaces) comes from `useNewsletterStore.ts`.

---

## Critical Pitfalls Summary (for Planner)

| Pitfall | File Affected | Guard |
|---|---|---|
| Auto-save fires on initial doc load | `useAutoSave.ts` | `isInitialLoadRef` + cleanup reset |
| `setDoc` in `onSuccess` = infinite save loop | `useAutoSave.ts`, `useUpdateNewsletter.ts` | Never call `setDoc` in mutation callbacks |
| `navigate(-1)` broken back button | `BuilderHeader.tsx` | Always use `navigate('/newsletters')` |
| `jsonb_array_length` returns NULL on missing key | `routes/newsletters.ts` | `COALESCE(jsonb_array_length(...), 0)` |
| `$onUpdate` doesn't run on INSERT | `schema.ts` | Also add `.defaultNow()` to `updatedAt` |
| Stale `updatedAt` in dashboard after save | `useUpdateNewsletter.ts`, `useRenameNewsletter.ts` | Update `updatedAt` in list cache via `setQueryData` in `onSuccess` |
| Dialog stays open after error | `CreateNewsletterDialog.tsx` | Only navigate (close) in `onSuccess`, not unconditionally |
| Wrong toast import | Any component | `toast` from `'sonner'`; `<Toaster>` from `'@/components/ui/sonner'` |
| Missing ESM `.js` in server imports | All server files | Add `.js` to every local import in `apps/server/src/` |

---

## Metadata

**Analog search scope:** `apps/server/src/`, `apps/client/src/`
**Files scanned:** 10 existing files read in full
**Pattern extraction date:** 2026-06-07
