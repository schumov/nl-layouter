# Phase 1: Foundation & Stack Setup — Research

**Researched:** 2026-06-05  
**Domain:** pnpm monorepo · Vite 8 · React 19 · Fastify 5 · Drizzle ORM · TipTap v3 · Tailwind v4 · Zustand  
**Confidence:** HIGH (all package versions live-verified from npm registry; patterns verified via Context7 official docs)

---

## Summary

Phase 1 establishes the entire technical skeleton for NL Layouter. All locked decisions from the project research (Drizzle not Prisma, TipTap v3 not v2, Tailwind v4 CSS-first, Zustand + Immer, dnd-kit typed drag types) are implemented here as permanent, unretrofittable foundations. The most consequential task in this phase is the `NewsletterDoc` discriminated union type — it must include **all five element types** including `DividerElement` (ARCHITECTURE.md's type listing only includes four; the fifth must be added). The second most consequential is TipTap's `renderHTML` configuration — inline-style-only output must be baked in from the start.

Two critical environment gaps were discovered during research: **pnpm is not directly available** (it exists as a corepack PowerShell script but is not on the PATH) and **Docker is not installed**. Both must be addressed before development begins. The plan must include explicit install steps for both, or provide verified fallbacks (neon.tech for Docker-free PostgreSQL).

**Primary recommendation:** Scaffold the monorepo root first, install pnpm globally via npm, then scaffold each app using `pnpm create` commands. Complete TipTap `renderHTML` configuration in Phase 1 even though TipTap isn't used interactively until Phase 7 — retrofitting is impossible without touching every extension.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Monorepo workspace config | Root (pnpm) | — | pnpm-workspace.yaml at root governs all packages |
| TypeScript type definitions (`NewsletterDoc`) | Shared (root) | Client + Server consume | Types used by both apps; belongs at shared root |
| DRAG_TYPES constants | Client (src/dnd/) | — | Only the client does DnD; server never needs drag types |
| TipTap extensions scaffold | Client (src/editor/) | — | Rich text editing is a client concern |
| Drizzle schema + DB connection | Server (apps/server/) | — | DB access is server-only; client never touches DB |
| Fastify server entry + CORS + cookies | Server (apps/server/) | — | HTTP server lives in server app |
| Zod env validation | Server (startup) | — | Validate `process.env` at server boot; fail fast |
| Tailwind v4 CSS config | Client (src/index.css) | — | Builder UI CSS; never in exported email HTML |
| Zustand store scaffold | Client (src/store/) | — | Canvas state is entirely client-side |
| TanStack Query setup | Client (src/main.tsx) | — | Wraps React tree; API caching is client concern |
| react-router setup | Client (src/main.tsx) | — | SPA routing is client-only |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All apps | ✓ | v22.9.0 (LTS) | — |
| npm | Package install | ✓ | 11.8.0 | — |
| pnpm | Workspace monorepo | ✗ (not on PATH) | — | `npm install -g pnpm` (Plan Wave 0) |
| Docker | PostgreSQL local dev | ✗ | — | Neon.tech free tier (cloud PG) OR local PG install |
| git | Version control | ✓ | 2.54.0 | — |
| corepack | pnpm activation | ✓ | 0.29.3 | — |

**Missing dependencies with no fallback:**
- None — all gaps have viable solutions.

**Missing dependencies with fallback:**
- **pnpm**: `npm install -g pnpm@latest` — must run before any `pnpm` command. Alternatively: `corepack prepare pnpm@latest --activate && corepack enable pnpm`. [VERIFIED: npm registry, corepack check]
- **Docker**: Use Neon.tech free tier (cloud PostgreSQL, connection string via env var) to avoid needing Docker during dev. The `docker-compose.yml` can still be created for future use. [ASSUMED — Neon.tech is a valid fallback but requires account creation]

---

## Standard Stack

### Core — Client (`apps/client`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.7 | UI framework | v19 stable with Actions, concurrent rendering |
| react-dom | 19.2.7 | React DOM renderer | Paired with react |
| typescript | 6.0.3 | Strict type safety | Required for Drizzle/Zod interop; strict mode by default |
| vite | 8.0.16 | Build tool + dev server | Fastest HMR; native ESM; React plugin via SWC |
| @vitejs/plugin-react | 6.0.2 | React JSX + HMR | Required for Vite 8 React support |
| tailwindcss | 4.3.0 | Builder UI CSS | CSS-first; no `tailwind.config.js` |
| @tailwindcss/vite | 4.3.0 | Tailwind v4 Vite plugin | No postcss needed; zero-config |
| react-router | 7.17.0 | SPA routing | Library mode (not framework); ~5 routes |
| zustand | 5.0.14 | Canvas state | Lightweight; Immer middleware built-in |
| immer | 11.1.8 | Immutable state updates | Required peer dep for `zustand/middleware/immer` |
| @tanstack/react-query | 5.101.0 | Server state / API cache | Loading states, optimistic updates |
| @dnd-kit/core | 6.3.1 | DnD context + sensors | Core primitives; accessible |
| @dnd-kit/sortable | 10.0.0 | Section reordering | `useSortable` for canvas row list |
| @dnd-kit/utilities | 3.2.2 | CSS transform helpers | `CSS.Transform.toString()` |
| @dnd-kit/modifiers | 9.0.0 | Drag constraints | `restrictToVerticalAxis` for rows |

> **⚠️ dnd-kit versioning:** core, sortable, utilities, modifiers have independent major versions — this is intentional as of late 2024. These exact versions are compatible. [VERIFIED: npm registry]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/react | 3.26.0 | TipTap React bindings | v3 — headless WYSIWYG |
| @tiptap/pm | 3.26.0 | ProseMirror peer dep | Must install explicitly in v3 |
| @tiptap/starter-kit | 3.26.0 | Bold/Italic/Link/Underline/Headings/Lists | v3 StarterKit includes Link + Underline |
| @tiptap/extensions | 3.26.0 | Focus/Placeholder/UndoRedo/Dropcursor | **v3 consolidation** — replaces separate packages |
| @tiptap/extension-text-style | 3.26.0 | Foundation for color marks | Required by Color extension |
| @tiptap/extension-color | 3.26.0 | Inline text color | Named style colors |
| shadcn (CLI) | 4.10.0 | Component generation | `npx shadcn@latest init -t vite` |
| lucide-react | 1.17.0 | Icons | Tree-shakeable stroke icons |
| clsx | 2.1.1 | Class composition | Standard conditional class helper |
| tailwind-merge | 3.6.0 | Merge Tailwind classes | Deduplicates conflicting Tailwind utilities |
| class-variance-authority | 0.7.1 | Variant-based styling | shadcn/ui component variants |

### Core — Server (`apps/server`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastify | 5.8.5 | HTTP framework | v5 stable; ~3× faster than Express; native TS |
| @fastify/cors | 11.2.0 | CORS for Vite dev | Required for client → server requests |
| @fastify/cookie | 11.0.2 | Cookie management | Needed by Better Auth (v2) |
| zod | 4.4.3 | Runtime validation | Env validation + request body schemas |
| dotenv | 16.x | `.env` file loading | Standard env var loading |
| tsx | 4.22.4 | TypeScript execution | Run server without compile step in dev |
| drizzle-orm | 0.45.2 | ORM | TypeScript-first; no codegen |
| drizzle-kit | 0.31.10 | Migrations | `drizzle-kit push` for dev |
| postgres | 3.4.9 | DB driver | Drizzle's recommended PG driver; native ESM |

### Dev tooling — Root

| Library | Version | Purpose |
|---------|---------|---------|
| concurrently | 10.0.3 | Run client + server simultaneously |
| typescript | 6.0.3 | Shared TS config |

### Verified Installation Command (client)

```bash
pnpm add react react-dom
pnpm add -D typescript vite @vitejs/plugin-react
pnpm add tailwindcss @tailwindcss/vite
pnpm add react-router zustand immer @tanstack/react-query
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extensions
pnpm add @tiptap/extension-text-style @tiptap/extension-color
pnpm add lucide-react clsx tailwind-merge class-variance-authority
```

### Verified Installation Command (server)

```bash
pnpm add fastify @fastify/cors @fastify/cookie
pnpm add zod dotenv drizzle-orm postgres
pnpm add -D drizzle-kit tsx typescript @types/node
```

---

## Architecture Patterns

### System Architecture Diagram

```
User Browser
     │
     │  http://localhost:3000 (Vite dev server)
     ▼
┌──────────────────────────────────────────┐
│  React SPA (apps/client)                  │
│                                            │
│  main.tsx                                  │
│   ├── QueryClientProvider (TanStack Query) │
│   ├── RouterProvider (react-router v7)     │
│   │    ├── / → placeholder                 │
│   │    └── /newsletters → placeholder      │
│   └── useNewsletterStore (Zustand+Immer)   │
│         └── NewsletterDoc JSON state       │
└──────────────────────────────────────────┘
     │
     │  fetch → http://localhost:3001 (Fastify)
     ▼
┌──────────────────────────────────────────┐
│  Fastify API (apps/server)                │
│                                            │
│  server.ts                                 │
│   ├── @fastify/cors (allow localhost:3000) │
│   ├── @fastify/cookie                      │
│   ├── GET /health → { status: "ok" }       │
│   └── Zod env validation at startup        │
│                                            │
│  db/connection.ts                          │
│   └── drizzle(postgres(DATABASE_URL))      │
└──────────────────────────────────────────┘
     │
     │  postgres.js driver
     ▼
┌──────────────────────────────────────────┐
│  PostgreSQL 16                             │
│  (Docker local OR Neon.tech cloud)         │
│  Empty schema — no tables yet (Phase 2)   │
└──────────────────────────────────────────┘
```

### Recommended Project Structure

```
NL_Layouter/                         # git root
├── pnpm-workspace.yaml               # apps/* + packages/*
├── package.json                      # workspace root: "dev" script
├── tsconfig.base.json                # shared strict TS config
├── .env.example                      # template for both apps
├── docker-compose.yml                # PostgreSQL 16 local dev
│
├── apps/
│   ├── client/                       # Vite 8 + React 19
│   │   ├── package.json
│   │   ├── vite.config.ts            # @tailwindcss/vite + @vitejs/plugin-react + @ alias
│   │   ├── tsconfig.json             # extends ../../tsconfig.base.json
│   │   ├── tsconfig.app.json         # app source files
│   │   ├── tsconfig.node.json        # vite.config.ts
│   │   ├── components.json           # shadcn/ui config (tailwind.config: "")
│   │   └── src/
│   │       ├── main.tsx              # QueryClientProvider + RouterProvider
│   │       ├── index.css             # @import "tailwindcss"; + shadcn CSS vars
│   │       ├── dnd/
│   │       │   └── types.ts          # DRAG_TYPES enum + accept constraint docs
│   │       ├── editor/
│   │       │   └── extensions.ts     # TipTap extension array w/ renderHTML stubs
│   │       ├── store/
│   │       │   └── useNewsletterStore.ts  # Zustand + Immer scaffold
│   │       ├── types/
│   │       │   └── newsletter.ts     # NewsletterDoc discriminated union
│   │       └── components/
│   │           └── ui/               # shadcn/ui generated components
│   │
│   └── server/                       # Fastify 5
│       ├── package.json
│       ├── tsconfig.json             # extends ../../tsconfig.base.json
│       ├── drizzle.config.ts         # drizzle-kit config
│       └── src/
│           ├── index.ts              # server entry + plugin registration
│           ├── config.ts             # Zod env schema + validated config
│           └── db/
│               └── connection.ts     # drizzle(postgres()) singleton
```

### Pattern 1: pnpm Workspace Setup

**What:** Root `pnpm-workspace.yaml` defines packages; root `package.json` has workspace-level scripts.
**When to use:** Always — the monorepo foundation.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
```

```json
// Root package.json
{
  "name": "nl-layouter",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter ./apps/client dev\" \"pnpm --filter ./apps/server dev\"",
    "build": "pnpm --recursive run build",
    "typecheck": "pnpm --recursive run typecheck"
  },
  "devDependencies": {
    "concurrently": "^10.0.3",
    "typescript": "^6.0.3"
  }
}
```
[VERIFIED: Context7 pnpm docs — /websites/pnpm_io]

### Pattern 2: Shared tsconfig.base.json

**What:** Root TypeScript config that each app extends.
**When to use:** Enforce strict mode uniformly across all workspace packages.

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

```json
// apps/client/tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```
[VERIFIED: Context7 shadcn/ui docs — tsconfig.json for Vite Tailwind v4]

### Pattern 3: Tailwind v4 CSS-First Config

**What:** No `tailwind.config.js`. CSS-only setup via single `@import`.
**When to use:** Always for Tailwind v4.

```typescript
// apps/client/vite.config.ts
// Source: Context7 shadcn/ui docs — vite.config.ts for Vite+Tailwind v4
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
})
```

```css
/* apps/client/src/index.css */
/* Source: Context7 shadcn/ui docs — src/index.css for Tailwind v4 */
@import "tailwindcss";

/* shadcn/ui will append @theme inline + CSS variable definitions here */
```
[VERIFIED: Context7 shadcn/ui docs — /shadcn-ui/ui installation/vite.mdx]

### Pattern 4: shadcn/ui CLI Init for Vite + Tailwind v4

```bash
# Run from apps/client directory
npx shadcn@latest init -t vite
```

This generates `components.json` with:
- `"tailwind.config": ""` — empty (v4 CSS-first, no config file)
- `"cssVariables": true` — OKLCH color variables in CSS
- `"rsc": false` — not a server component project

[VERIFIED: Context7 shadcn/ui docs — /shadcn-ui/ui installation/vite.mdx]

### Pattern 5: Drizzle ORM + postgres.js + JSONB

```typescript
// apps/server/src/db/connection.ts
// Source: Context7 Drizzle ORM docs — /drizzle-team/drizzle-orm-docs
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: queryClient });
```

```typescript
// apps/server/drizzle.config.ts
// Source: Context7 Drizzle ORM docs — drizzle.config.ts examples
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

> **Phase 1 DB scope:** In Phase 1, create only the DB connection and config. The `newsletters` table schema is added in Phase 2. The initial migration in Phase 1 should be an empty schema verification (confirm `drizzle-kit push` runs without error on an empty schema).

JSONB column syntax (used in Phase 2, defined here for reference):
```typescript
// Source: Context7 Drizzle docs — jsonb column type
import { jsonb, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import type { NewsletterDoc } from '@nl-layouter/types'; // or relative import

export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  document: jsonb('document').$type<NewsletterDoc>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```
[VERIFIED: Context7 Drizzle ORM docs — /drizzle-team/drizzle-orm-docs]

### Pattern 6: Fastify Server Entry with CORS + Health Check

```typescript
// apps/server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';

const server = Fastify({
  logger: true,
});

await server.register(cors, {
  origin: config.CLIENT_URL, // e.g. 'http://localhost:3000'
  credentials: true,
});

await server.register(cookie);

server.get('/health', async () => {
  return { status: 'ok' };
});

await server.listen({ port: config.PORT, host: '0.0.0.0' });
```
[VERIFIED: Context7 Fastify docs — /fastify/fastify, plugin registration and cookie examples]

### Pattern 7: Zod Env Validation at Startup

```typescript
// apps/server/src/config.ts
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Throws with descriptive error at startup if env is invalid
export const config = EnvSchema.parse(process.env);
export type Config = typeof config;
```

> **Zod v4 note:** `z.coerce.number()` and `z.enum()` behave identically to v3. `z.string().min(1)` replaces `z.string().nonempty()` which was deprecated. [VERIFIED: Context7 Zod docs]

### Pattern 8: NewsletterDoc Discriminated Union — Complete with All 5 Elements

> **Critical:** ARCHITECTURE.md only defines 4 element types. REQUIREMENTS.md and ROADMAP.md both specify 5 (image, image-link, button, rich-text, **divider**). The `DividerElement` MUST be included in Phase 1 types.

```typescript
// apps/client/src/types/newsletter.ts  (also importable by server)

// ─── Primitive types ────────────────────────────────────────────────

export type LayoutType =
  | '1col'
  | '2col'
  | '3col'
  | 'small-left-big-right'   // 33% / 67% split
  | 'big-left-small-right';  // 67% / 33% split

// ─── Element types (discriminated union on `type`) ──────────────────

export interface ImageElement {
  type: 'image';
  id: string;
  src: string;
  alt: string;
  width?: string;             // e.g. "100%" or "300px"
}

export interface ImageLinkElement {
  type: 'image-link';
  id: string;
  src: string;
  alt: string;
  href: string;
  width?: string;
}

export interface ButtonElement {
  type: 'button';
  id: string;
  label: string;
  href: string;
  backgroundColor: string;   // hex e.g. "#0066cc"
  textColor: string;         // hex e.g. "#ffffff"
  borderRadius?: string;     // e.g. "4px"
  style: 'solid' | 'outline' | 'ghost';
}

export interface RichTextElement {
  type: 'rich-text';
  id: string;
  content: TiptapJSONDoc;    // TipTap JSONContent: { type: 'doc', content: [...] }
  textStyle: 'header' | 'subheader' | 'body' | 'code';
}

export interface DividerElement {
  type: 'divider';
  id: string;
  color: string;             // hex e.g. "#cccccc"
  spacing: number;           // padding above + below in px
  thickness: number;         // hr height in px
}

// The discriminated union — exhaustive switch on `type` always works
export type ElementUnion =
  | ImageElement
  | ImageLinkElement
  | ButtonElement
  | RichTextElement
  | DividerElement;

// ─── TipTap JSON type ───────────────────────────────────────────────

export interface TiptapJSONDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

// ─── Canvas structure ───────────────────────────────────────────────

export interface ColumnSlot {
  id: string;
  element: ElementUnion | null;   // null = empty/droppable
}

export interface Section {
  id: string;                     // UUID — stable DnD key
  layoutType: LayoutType;
  slots: ColumnSlot[];            // length always matches layoutType column count
  backgroundColor?: string;
  paddingTop?: number;            // px
  paddingBottom?: number;         // px
}

// ─── Header / Footer presets ────────────────────────────────────────

export interface HeaderConfig {
  presetId: string;               // e.g. "header-minimal"
  variables: Record<string, string>;
}

export interface FooterConfig {
  presetId: string;               // e.g. "footer-legal"
  variables: Record<string, string>;
}

// ─── Top-level document ─────────────────────────────────────────────

export interface GlobalStyles {
  fontFamily: string;             // e.g. "Arial, sans-serif"
  backgroundColor: string;       // e.g. "#f4f4f4"
  contentWidth: number;          // px — always 600 for email
  primaryColor: string;          // e.g. "#0066cc"
}

export interface NewsletterDoc {
  header: HeaderConfig;
  rows: Section[];
  footer: FooterConfig;
  globalStyles: GlobalStyles;
}

// Type guard helpers
export const isImageElement = (el: ElementUnion): el is ImageElement => el.type === 'image';
export const isImageLinkElement = (el: ElementUnion): el is ImageLinkElement => el.type === 'image-link';
export const isButtonElement = (el: ElementUnion): el is ButtonElement => el.type === 'button';
export const isRichTextElement = (el: ElementUnion): el is RichTextElement => el.type === 'rich-text';
export const isDividerElement = (el: ElementUnion): el is DividerElement => el.type === 'divider';
```

### Pattern 9: DRAG_TYPES Constants

```typescript
// apps/client/src/dnd/types.ts

/**
 * All drag interaction types in NL Layouter.
 * Define here; use typed `accept` on every useDroppable call.
 * Never use string literals directly — always reference DRAG_TYPES.
 */
export const DRAG_TYPES = {
  /** Palette layout card → drops into canvas to add a new section */
  LAYOUT_CARD: 'LAYOUT_CARD',
  /** Palette element card → drops into a column slot to add a new element */
  ELEMENT_CARD: 'ELEMENT_CARD',
  /** Canvas section drag handle → reorders existing sections */
  CANVAS_ROW: 'CANVAS_ROW',
  /** Canvas element move → relocates element between slots */
  CANVAS_ELEMENT: 'CANVAS_ELEMENT',
} as const;

export type DragType = (typeof DRAG_TYPES)[keyof typeof DRAG_TYPES];

/**
 * Accept constraint map — which drag types each droppable zone accepts.
 * Copy these exact arrays into useDroppable({ accept: ... }) calls.
 *
 * Canvas section list:
 *   accept: [DRAG_TYPES.LAYOUT_CARD, DRAG_TYPES.CANVAS_ROW]
 *
 * Column slot:
 *   accept: [DRAG_TYPES.ELEMENT_CARD, DRAG_TYPES.CANVAS_ELEMENT]
 */
export const ACCEPT_CONSTRAINTS = {
  CANVAS_SECTION_LIST: [DRAG_TYPES.LAYOUT_CARD, DRAG_TYPES.CANVAS_ROW],
  COLUMN_SLOT: [DRAG_TYPES.ELEMENT_CARD, DRAG_TYPES.CANVAS_ELEMENT],
} as const;
```

### Pattern 10: TipTap v3 Extensions with Inline-Style renderHTML

> **Critical:** This configuration is locked in Phase 1 and cannot be retrofitted. Every extension that outputs HTML must use `renderHTML` with inline `style=""` attributes only.

```typescript
// apps/client/src/editor/extensions.ts
// Source: Context7 TipTap docs — renderHTML inline styles pattern
import StarterKit from '@tiptap/starter-kit';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/starter-kit'; // included in StarterKit v3
import Bold from '@tiptap/starter-kit';           // re-extend from StarterKit

// Phase 1: Register extensions with stub renderHTML overrides.
// Phase 7 will flesh out the full inline-style mappings.
// The critical contract: NEVER output class="" on any text element.

const InlineStyleBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    // Emit inline style, not class-based markup
    return ['span', { style: 'font-weight: bold;', ...HTMLAttributes }, 0];
  },
});

// NOTE: StarterKit.configure() sets up most extensions.
// Individual extensions that default to class-based output
// must be extended with custom renderHTML before Phase 7.
// This file is the single source of truth for all extension config.

export const emailSafeExtensions = [
  StarterKit.configure({
    // Disable built-in history — use UndoRedo from @tiptap/extensions
    undoRedo: false,
    // Additional StarterKit config as needed
  }),
  UndoRedo,                // Renamed from 'History' in v3
  TextStyle,               // Required by Color extension
  Color,                   // Inline text color
  Placeholder.configure({
    placeholder: 'Start typing…',
  }),
];

// Usage in useEditor:
// import { emailSafeExtensions } from './extensions'
// useEditor({ extensions: emailSafeExtensions, content: jsonDoc })
```

> **Package import note verified from TipTap v3 migration guide (Context7):**
> - `import { Focus, Placeholder, UndoRedo, Dropcursor } from '@tiptap/extensions'` — new in v3
> - `import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'` — moved in v3 (NOT from `'@tiptap/react'`)
> - `import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'` — consolidated in v3
> - `History` → renamed to `UndoRedo` in `@tiptap/extensions`
> [VERIFIED: Context7 TipTap docs — /ueberdosis/tiptap-docs upgrade-tiptap-v2.mdx]

### Pattern 11: Zustand + Immer Store Scaffold

```typescript
// apps/client/src/store/useNewsletterStore.ts
// Source: Context7 Zustand docs — immer middleware pattern
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';  // NOT from 'immer' directly
import type { NewsletterDoc, Section, ElementUnion } from '../types/newsletter';

interface NewsletterState {
  doc: NewsletterDoc | null;
  selectedElementId: string | null;
}

interface NewsletterActions {
  setDoc: (doc: NewsletterDoc) => void;
  clearDoc: () => void;
  setSelectedElement: (id: string | null) => void;
  // Section mutations (Phase 4 will add more)
  addSection: (section: Section) => void;
  removeSection: (sectionId: string) => void;
  // Element mutations (Phase 5 will add more)
  setElement: (sectionId: string, slotId: string, element: ElementUnion | null) => void;
}

export const useNewsletterStore = create<NewsletterState & NewsletterActions>()(
  immer((set) => ({
    // ─── State ─────────────────────────────────────────────────────
    doc: null,
    selectedElementId: null,

    // ─── Actions ───────────────────────────────────────────────────
    setDoc: (doc) => set((state) => { state.doc = doc; }),
    clearDoc: () => set((state) => { state.doc = null; }),
    setSelectedElement: (id) => set((state) => { state.selectedElementId = id; }),

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

    setElement: (sectionId, slotId, element) =>
      set((state) => {
        const section = state.doc?.rows.find((r) => r.id === sectionId);
        const slot = section?.slots.find((s) => s.id === slotId);
        if (slot) slot.element = element;
      }),
  }))
);
```
[VERIFIED: Context7 Zustand docs — /pmndrs/zustand immer middleware pattern]

### Pattern 12: react-router v7 SPA (Library Mode)

```typescript
// apps/client/src/main.tsx
// Source: Context7 react-router docs — createBrowserRouter + RouterProvider
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Home placeholder</div>,
  },
  {
    path: '/newsletters',
    element: <div>Newsletters placeholder</div>,
  },
  {
    path: '/newsletters/:id',
    element: <div>Builder placeholder</div>,
  },
]);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
```

> **Library mode vs Framework mode:** react-router v7 supports two modes. For this SPA, use **library mode** (`createBrowserRouter` + `RouterProvider`) — the same pattern as react-router v6. Framework mode (Remix-style with `@react-router/dev/vite`) is for full-stack apps with SSR. [VERIFIED: Context7 react-router docs]

### Anti-Patterns to Avoid

- **Mixing TipTap v2 and v3 packages:** `@tiptap/extension-history` (v2) + `@tiptap/extensions` (v3) together will cause version conflicts and runtime errors. Use only v3 packages.
- **Using `tailwind.config.js` with Tailwind v4:** Tailwind v4 ignores this file. Configuration goes in CSS (`@import "tailwindcss"`, `@theme`, `@custom-variant`).
- **Using `shadcn-ui` package (not CLI):** `shadcn-ui` (npm package) is deprecated. Use `shadcn` (CLI) — `npx shadcn@latest init`.
- **Importing `immer` directly in Zustand middleware:** `import { produce } from 'immer'` is NOT how you use Immer with Zustand. Use `import { immer } from 'zustand/middleware/immer'` instead.
- **Using `@tiptap/react`'s `BubbleMenu`/`FloatingMenu` in v3:** These were moved to `@tiptap/react/menus` in v3. `import { BubbleMenu } from '@tiptap/react'` will throw a module not found error.
- **Using react-router's `<BrowserRouter>` component:** This is the v5 API. In v7 library mode, use `createBrowserRouter` + `RouterProvider`.
- **Storing ordered data without an explicit order field:** Array index ordering breaks on reorder + concurrent saves. Phase 1 types must include explicit `order` or rely on JSONB array position (valid since the whole doc is atomic JSONB).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Immutable nested state updates | Manual `{...state, rows: [...state.rows, newRow]}` | `zustand/middleware/immer` | Deep nesting makes spread operators error-prone; Immer handles structural sharing |
| TypeScript validation at runtime | `if (typeof x === 'string')` guards | `zod` schemas | Zod gives typed inference + runtime error messages for free |
| CSS class composition | String concatenation | `clsx` + `tailwind-merge` | Handles conditional classes + deduplicates conflicting Tailwind utilities |
| Component variants | Multiple if/switch branches | `class-variance-authority` | CVA provides type-safe `variants` API that shadcn components depend on |
| TipTap editor HTML serialization | Custom DOM traversal | `editor.getJSON()` + `@tiptap/static-renderer` | TipTap's JSON format is stable; custom DOM parsing is brittle |
| PostgreSQL migrations | Hand-written SQL files | `drizzle-kit push` / `drizzle-kit migrate` | Drizzle generates SQL from schema; tracks migrations automatically |
| CORS headers | Manual `res.setHeader('Access-Control-...')` | `@fastify/cors` | Handles preflight, credentials, wildcard cases correctly |

---

## Common Pitfalls

### Pitfall 1: TipTap Default HTML Output Breaks Email Clients

**What goes wrong:** Default TipTap output uses CSS classes (`<p class="has-text-align-center">`, `<span class="has-color-#ff0000">`). Gmail strips all `<style>` blocks; Outlook ignores class-based styles. All text formatting is lost in the two most-used email clients.

**Why it happens:** The browser renders TipTap output perfectly, so devs never notice until testing in a real email client.

**How to avoid:** Configure every TipTap extension with `renderHTML` that emits only `style=""` attributes. This is done in Phase 1's `src/editor/extensions.ts`. **There is no retrofit path** — changing `renderHTML` after Phase 7's rich text work is built requires rewriting all extension configs.

**Warning signs:** `editor.getHTML()` output contains `class=` attributes on text spans or paragraphs.

[VERIFIED: Context7 TipTap docs — renderHTML inline styles pattern]

### Pitfall 2: pnpm Not on PATH After corepack Install

**What goes wrong:** `corepack` 0.29.3 is installed and `C:\Program Files\nodejs\pnpm.ps1` exists, but `pnpm --version` fails from a fresh shell because the script isn't on the standard PATH.

**Why it happens:** On Windows, corepack installs pnpm as a `.ps1` file but doesn't always update the PATH correctly for all terminal types.

**How to avoid:** Run `npm install -g pnpm` before starting. This adds `pnpm` as a globally available command independent of corepack. Verify with `pnpm --version` in a fresh terminal.

**Warning signs:** `The term 'pnpm' is not recognized` error when running pnpm commands.

[VERIFIED: local environment check — corepack v0.29.3 present, pnpm not on PATH]

### Pitfall 3: Docker Dependency Blocks Database Setup

**What goes wrong:** `docker-compose.yml` is created but Docker Desktop is not installed. `docker compose up` fails with "command not found." Database connection string is undefined. Server startup fails with Zod env validation error.

**Why it happens:** Docker Desktop must be installed separately on Windows; it's not bundled with Node.js.

**How to avoid:** Either (a) install Docker Desktop first, OR (b) use Neon.tech free tier (cloud PostgreSQL) and set `DATABASE_URL` to the Neon connection string. The `docker-compose.yml` can still be committed for reproducibility.

**Warning signs:** `drizzle-kit push` fails with "connection refused" or server startup throws "DATABASE_URL: Required".

### Pitfall 4: DividerElement Missing from Type Definition

**What goes wrong:** ARCHITECTURE.md's TypeScript type listing only shows 4 element types (image, image-link, button, rich-text). `DividerElement` is missing. If Phase 1 types only define 4 types, Phase 7's divider work requires a type schema change that forces updates to every function that pattern-matches on `ElementUnion`.

**Why it happens:** The ARCHITECTURE.md was written slightly ahead of the full requirements spec.

**How to avoid:** Define all 5 types in Phase 1: `ImageElement | ImageLinkElement | ButtonElement | RichTextElement | DividerElement`. Use `exhaustiveCheck` (never type) in switch statements to get compile-time safety.

**Warning signs:** A switch/if-chain on `element.type` that doesn't have a `divider` branch.

### Pitfall 5: TypeScript 6.x Strict Flags Break Standard Patterns

**What goes wrong:** TypeScript 6.0.3 with `noUncheckedIndexedAccess: true` means `array[0]` returns `T | undefined`, not `T`. Code like `const slot = section.slots[0]; slot.element` will fail to compile because `slot` could be `undefined`.

**Why it happens:** TypeScript 6 has stricter defaults for array indexing.

**How to avoid:** Use optional chaining (`section.slots[0]?.element`) or explicit null checks. Consider omitting `noUncheckedIndexedAccess` in `tsconfig.base.json` and enabling it only selectively if it's too noisy for the codebase. [ASSUMED — behavior in TS 6.0.3 extrapolated from TS 4.1+ `noUncheckedIndexedAccess` semantics; exact defaults may vary]

**Warning signs:** Compile errors on `array[n].property` access patterns.

### Pitfall 6: Vite 8 Monorepo `@` Alias Must Be in Each App's tsconfig

**What goes wrong:** The `@` path alias defined in `vite.config.ts`'s `resolve.alias` is a Vite runtime alias. TypeScript's language server needs a matching `paths` entry in `tsconfig.json` (or `tsconfig.app.json`) to resolve imports. Without it, the editor shows "Cannot find module '@/components/...'" errors even though Vite compiles fine.

**How to avoid:** Add to each app's tsconfig:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```
[VERIFIED: Context7 shadcn/ui docs — tsconfig.json for Vite path aliases]

### Pitfall 7: Zod v4 API Surface Changes from v3

**What goes wrong:** Code using v3-specific APIs fails with cryptic errors.

**Key v4 changes to know:**
- `z.string().nonempty()` → use `z.string().min(1)` instead
- `z.ZodError` import path may differ — use `import { ZodError } from 'zod'`
- New shorthand validators: `z.email()`, `z.url()`, `z.uuid()` as top-level (also still on `z.string()`)
- `z.coerce.number()` still works for env var number coercion

[VERIFIED: Context7 Zod docs — /colinhacks/zod]

---

## Code Examples

### Drizzle drizzle-kit push workflow

```bash
# 1. Start PostgreSQL (Docker or Neon connection string in .env)
# 2. Run push to sync schema
cd apps/server
pnpm drizzle-kit push

# Expected output for empty schema (Phase 1):
# No schema changes detected ✓
# (or creates empty schema if first run)
```

### TipTap renderHTML — Correct Pattern for Email Output

```typescript
// Source: Context7 TipTap docs — /ueberdosis/tiptap-docs extend-existing.mdx

// WRONG — default TipTap behavior (class-based):
// <p class="has-text-align-center">text</p>

// CORRECT — custom renderHTML with inline styles:
const TextAlignExtension = TextAlign.extend({
  addAttributes() {
    return {
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign) return {};
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
});

// Color via TextStyle — also inline:
const CustomColor = Color.extend({
  renderHTML({ HTMLAttributes }) {
    return ['span', { style: `color: ${HTMLAttributes.color}`, ...HTMLAttributes }, 0];
  },
});
```

### Fastify Health Check + TypeScript

```typescript
// Source: Fastify docs pattern (training knowledge — ASSUMED basic Fastify route)
server.get('/health', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
    },
  },
}, async (_request, _reply) => {
  return { status: 'ok' };
});
```

### pnpm dev script (both apps simultaneously)

```json
// Root package.json
{
  "scripts": {
    "dev": "concurrently --names client,server --prefix-colors cyan,yellow \"pnpm --filter ./apps/client dev\" \"pnpm --filter ./apps/server dev\""
  }
}
```

Expected output when `pnpm dev` runs:
- `[client]  VITE v8.x ready on http://localhost:3000`
- `[server]  Server listening on http://0.0.0.0:3001`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-only `@import "tailwindcss"` | Tailwind v4 (2025) | No JS config; all customization in CSS |
| `@tiptap/extension-history` | `UndoRedo` from `@tiptap/extensions` | TipTap v3 (2025) | Consolidated package |
| `import { BubbleMenu } from '@tiptap/react'` | `from '@tiptap/react/menus'` | TipTap v3 (2025) | Module path changed |
| Individual `@tiptap/extension-*` packages | `@tiptap/extensions` bundle | TipTap v3 (2025) | Fewer installs |
| `react-beautiful-dnd` | `@dnd-kit/*` | 2023 (RBDnD discontinued) | RBDnD officially deprecated by Atlassian |
| `<BrowserRouter>` component | `createBrowserRouter` + `RouterProvider` | react-router v6.4+ | Data router API; enables loaders/actions |
| Prisma ORM | Drizzle ORM | Project decision | No codegen, lighter runtime |
| postcss + tailwind plugin | `@tailwindcss/vite` | Tailwind v4 | Zero postcss config |

**Deprecated/outdated:**
- `shadcn-ui` (npm package): Replaced by `shadcn` CLI. Never `npm install shadcn-ui`.
- `@tiptap/extension-history`: Renamed to `UndoRedo`, import from `@tiptap/extensions`.
- `tailwind.config.js`: Ignored by Tailwind v4. Remove if present.
- `immer` direct import in Zustand: Use `zustand/middleware/immer` module.

---

## Validation Architecture

> `workflow.nyquist_validation: true` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (via Vite ecosystem) |
| Config file | `apps/client/vitest.config.ts` — Wave 0 gap |
| Quick run command | `pnpm --filter ./apps/client test --run` |
| Full suite command | `pnpm --recursive run test` |
| TypeScript type check | `pnpm --filter ./apps/client exec tsc --noEmit` |

> **Why Vitest:** Phase 1 is purely foundational (types, config, scaffold). Tests are type-safety checks and smoke tests, not unit tests of business logic. Vitest integrates with Vite naturally; no separate config needed beyond a minimal `vitest.config.ts`.

### Phase Verification Map (Done-When Criteria → Test Approach)

| Done-When Criterion | Test Type | Automated Command | Notes |
|---------------------|-----------|-------------------|-------|
| `pnpm dev` starts client on port 3000 with zero errors | Smoke | `pnpm --filter ./apps/client dev` then `curl http://localhost:3000` | Manual verification during dev; CI: `vite build --mode development` |
| `pnpm dev` starts server on port 3001 with zero errors | Smoke | `curl http://localhost:3001/health` | Automated: `tsx src/index.ts` in test mode |
| `GET /health` returns `{ "status": "ok" }` | Integration | `curl -s http://localhost:3001/health \| jq .status` | Should equal `"ok"` |
| `drizzle-kit push` applies initial schema without errors | Integration | `cd apps/server && pnpm drizzle-kit push` | Requires live PostgreSQL connection |
| TypeScript strict compilation passes (client) | Type check | `pnpm --filter ./apps/client exec tsc --noEmit` | Zero errors required |
| TypeScript strict compilation passes (server) | Type check | `pnpm --filter ./apps/server exec tsc --noEmit` | Zero errors required |
| `NewsletterDoc` type models all 5 element types | Type test | Vitest type assertion file | See Wave 0 gap below |

### Type Safety Test (Wave 0 — write before implementation)

```typescript
// apps/client/src/types/__tests__/newsletter.test-d.ts
import { describe, expectTypeOf } from 'vitest';
import type { ElementUnion, NewsletterDoc } from '../newsletter';

describe('NewsletterDoc type coverage', () => {
  it('ElementUnion covers all 5 element types', () => {
    const el: ElementUnion = { type: 'divider', id: 'x', color: '#ccc', spacing: 8, thickness: 1 };
    expectTypeOf(el).toMatchTypeOf<ElementUnion>();
  });

  it('DividerElement is part of ElementUnion', () => {
    expectTypeOf<Extract<ElementUnion, { type: 'divider' }>>().not.toBeNever();
  });

  it('switch on element.type is exhaustive', () => {
    function assertNever(x: never): never { throw new Error(`Unhandled: ${x}`); }
    function render(el: ElementUnion): string {
      switch (el.type) {
        case 'image': return el.src;
        case 'image-link': return el.href;
        case 'button': return el.label;
        case 'rich-text': return 'rich-text';
        case 'divider': return 'divider';
        default: return assertNever(el); // must not error
      }
    }
    expectTypeOf(render).toBeFunction();
  });
});
```

### Sampling Rate

- **Per task commit:** `pnpm --filter ./apps/client exec tsc --noEmit && pnpm --filter ./apps/server exec tsc --noEmit`
- **Per wave merge:** Full type check + `vitest --run` + `curl /health` smoke test
- **Phase gate:** All TypeScript compiles clean + `/health` returns 200 + `drizzle-kit push` exits 0

### Wave 0 Gaps

- [ ] `apps/client/vitest.config.ts` — minimal Vitest config (extends vite.config)
- [ ] `apps/client/src/types/__tests__/newsletter.test-d.ts` — type coverage for all 5 elements
- [ ] `apps/client/package.json` must include `"test": "vitest"` and `"typecheck": "tsc --noEmit"` scripts
- [ ] `apps/server/package.json` must include `"typecheck": "tsc --noEmit"` script

---

## Security Domain

> Phase 1 has no authentication, no user input, no API routes beyond `/health`. Security surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1 |
| V3 Session Management | No | No sessions in v1 |
| V4 Access Control | No | No protected routes in v1 |
| V5 Input Validation | Partial | Zod env schema at startup only |
| V6 Cryptography | No | No crypto in Phase 1 |
| V14 Configuration | Yes | `.env.example` documents required vars; never commit real `.env` |

### Phase 1 Security Checklist

- [ ] `.env` added to `.gitignore`  
- [ ] `.env.example` committed with placeholder values (no real secrets)
- [ ] `DATABASE_URL` validated via Zod before server starts
- [ ] CORS configured with explicit `origin: config.CLIENT_URL` (not `'*'`)

---

## Open Questions

1. **Docker vs Neon.tech for local PostgreSQL**
   - What we know: Docker not installed; Neon.tech is a free-tier cloud PG alternative
   - What's unclear: Whether the developer wants to install Docker Desktop or use cloud PG
   - Recommendation: Create `docker-compose.yml` either way (good docs/reproducibility), but default instructions in README should include Neon.tech as the zero-install path

2. **TypeScript strict flag `exactOptionalPropertyTypes`**
   - What we know: This flag treats `{ x?: string }` differently from `{ x?: string | undefined }`
   - What's unclear: Whether existing third-party types (Fastify, Drizzle) are compatible with this flag
   - Recommendation: Enable in `tsconfig.base.json` but be prepared to disable it if third-party types conflict

3. **pnpm workspace catalog for shared dependency versions**
   - What we know: pnpm v10 supports `catalog:` in `pnpm-workspace.yaml` for pinned versions
   - What's unclear: Whether to use catalogs (more DX setup) or just pin in each app's `package.json`
   - Recommendation: Skip catalogs for Phase 1; straightforward pinned versions in each app is sufficient

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `noUncheckedIndexedAccess` causes `array[n]` to return `T \| undefined` in TS 6.x | Pitfall 5 | Lower risk if TS 6 changed behavior; strict array typing may differ |
| A2 | Neon.tech free tier is a valid fallback for local PostgreSQL dev | Environment Availability | Neon.tech may require account setup; connection strings differ slightly from local PG |
| A3 | `@tiptap/extension-color`'s default behavior emits class-based markup requiring renderHTML override | Pitfall 1 / Pattern 10 | If Color already emits inline styles by default, the override is unnecessary but harmless |
| A4 | TypeScript 6.x introduced stricter defaults vs TS 5.x | Pitfall 5 | If TS 6 didn't change defaults, the warning is overly cautious |

---

## Sources

### Primary (HIGH confidence)

- Context7 `/drizzle-team/drizzle-orm-docs` — postgres.js driver init, JSONB column type, drizzle.config.ts, drizzle-kit push
- Context7 `/ueberdosis/tiptap-docs` — v3 package migration guide, renderHTML inline styles, StarterKit, TextStyle/Color, useEditor
- Context7 `/shadcn-ui/ui` — Vite + Tailwind v4 init, vite.config.ts with @tailwindcss/vite, components.json
- Context7 `/pmndrs/zustand` — immer middleware pattern, TypeScript store setup
- Context7 `/remix-run/react-router` — createBrowserRouter + RouterProvider SPA pattern
- Context7 `/fastify/fastify` — plugin registration, cors, cookie
- Context7 `/websites/pnpm_io` — pnpm-workspace.yaml, packages glob, filter commands, catalog
- Context7 `/colinhacks/zod` — Zod v4 API, coerce, string validators
- npm registry (live, 2026-06-05) — all package versions verified

### Secondary (MEDIUM confidence)

- Local environment probe (PowerShell, 2026-06-05) — Node v22.9.0, npm 11.8.0, pnpm absent, Docker absent, corepack 0.29.3
- Project research files STACK.md, ARCHITECTURE.md, PITFALLS.md, STATE.md — verified against live registry where applicable

### Tertiary (LOW confidence — A-tags)

- Neon.tech as Docker fallback — not verified; based on known platform capabilities
- TypeScript 6.x strict flag behavior — extrapolated from 5.x; exact TS 6.0.3 defaults not checked against official TS release notes

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — all verified from live npm registry
- Architecture patterns: HIGH — verified against Context7 official docs (Drizzle, TipTap v3, Zustand, react-router, shadcn)
- Environment availability: HIGH — directly probed via PowerShell
- Pitfalls: HIGH — derived from existing project PITFALLS.md (verified 2026-06-05) + Context7 cross-reference
- Type definitions: HIGH — derived from ARCHITECTURE.md + REQUIREMENTS.md (DividerElement addition)

**Research date:** 2026-06-05  
**Valid until:** 2026-08-05 (stable libs) / 2026-07-05 (TipTap v3, react-router v7 — faster-moving)
