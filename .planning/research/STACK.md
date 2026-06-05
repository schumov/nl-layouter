# Technology Stack — NL Layouter

**Project:** NL Layouter — Web-based drag-and-drop HTML newsletter builder
**Researched:** 2026-06-05
**Research method:** npm version registry (live), Context7 official docs (TipTap, Fastify, Drizzle, Zustand, React, Better Auth, TanStack Router)

---

## Recommended Stack

### Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.2.7 | UI framework | Stable v19 with Actions, `useActionState`, concurrent rendering. Best DnD + rich-text ecosystem. Confirmed current. |
| TypeScript | 6.0.3 | Type safety | Strict typing prevents runtime bugs in complex canvas state. Required for Drizzle and Zod interop. |
| Vite | 8.0.16 | Build tool / dev server | Fastest cold start, native ESM, first-class React + Tailwind 4 plugins. Replaces CRA entirely. |
| @vitejs/plugin-react | 6.0.2 | React JSX transform + HMR | Official React fast refresh via SWC. Needed for Vite 8. |
| Tailwind CSS | 4.3.0 | Utility CSS for builder UI | v4 uses CSS-first config (`@import "tailwindcss"`) — no `tailwind.config.js`. Pairs with `@tailwindcss/vite`. **Builder UI only** — never used for email output. |
| @tailwindcss/vite | 4.3.0 | Tailwind v4 Vite plugin | Zero-config integration; replaces postcss pipeline for Tailwind. |
| react-router | 7.17.0 | Client-side routing | v7 (formerly Remix-router). Simple file-based SPA routing, auth-protected routes. Lighter than TanStack Router for a pure SPA with ~5 routes. |
| Zustand | 5.0.14 | Canvas + editor global state | Manages newsletter document tree (sections, elements, selection state). v5 API is stable; `immer` middleware available. Avoids Redux boilerplate entirely. |
| @tanstack/react-query | 5.101.0 | Server state / API cache | Handles API calls, loading/error states, optimistic updates (save newsletter). Pairs with Zustand — query for persistence, Zustand for in-memory canvas. |
| lucide-react | 1.17.0 | Icon set | Tree-shakeable, consistent stroke icons. Used in toolbar and palette. |
| clsx + tailwind-merge | 2.1.1 / 3.6.0 | Class composition | Standard pair for conditional Tailwind classes. |

**Confidence: HIGH** — All versions verified from live npm registry; React 19 and Vite 8 confirmed stable via official docs.

---

### Rich Text Editing

> **⚠️ CRITICAL:** TipTap is now at **v3** (3.26.0) — not v2 as commonly referenced in older tutorials. v3 has significant breaking changes in package structure. Use v3 from the start.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tiptap/react | 3.26.0 | React bindings + `useEditor` hook | Headless WYSIWYG built on ProseMirror. No styling lock-in — critical for email output control. |
| @tiptap/pm | 3.26.0 | ProseMirror peer dependency | Required by all Tiptap packages. Install explicitly. |
| @tiptap/starter-kit | 3.26.0 | Bold, Italic, Link (v3), Underline (v3), Headings, Lists, Code | v3 StarterKit now includes Link and Underline — no longer need separate installs. |
| @tiptap/extensions | 3.26.0 | Focus, Placeholder, UndoRedo, Dropcursor | v3 consolidated these into one package (formerly separate `@tiptap/extension-*` packages). |
| @tiptap/extension-image | 3.26.0 | Image node | Still separate; needed for image elements in rich text. |
| @tiptap/extension-text-style | 3.26.0 | Text color/size marks | Foundation for Color extension. |
| @tiptap/extension-color | 3.26.0 | Inline text color | Needed for Header/Subheader/Text named styles. |

**v3 Breaking Changes to Know:**
- `BubbleMenu` / `FloatingMenu` moved: `import { BubbleMenu } from '@tiptap/react/menus'` (not `'@tiptap/react'`)
- Menus now use Floating UI instead of Tippy.js — configure with `options.offset` / `options.placement`
- List extensions merged: `import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'`
- History renamed to `UndoRedo` in `@tiptap/extensions`
- `editor.getHTML()` still works for serialization — unchanged

**Why TipTap over alternatives:**
- **vs Quill**: Quill maintenance has stalled; last major release 2019
- **vs Slate.js**: Slate is too low-level; TipTap abstracts ProseMirror correctly
- **vs Draft.js**: Facebook deprecated it; community migrated to TipTap/Lexical
- **vs Lexical (Meta)**: Viable alternative, but TipTap has better ecosystem, more extensions, cleaner React integration

**Confidence: HIGH** — Verified via Context7 TipTap docs and npm registry.

---

### Drag & Drop

> **Note:** dnd-kit packages use **independent versioning** (core ≠ sortable ≠ modifiers). This is intentional as of v2024. Install exact versions below; they are compatible.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @dnd-kit/core | 6.3.1 | Drag context, sensors, collision detection | Core primitives: `DndContext`, `useDraggable`, `useDroppable`. Accessible, performant, no jQuery. |
| @dnd-kit/sortable | 10.0.0 | Reorderable lists | Powers layout section reordering on canvas (`useSortable`, `SortableContext`). |
| @dnd-kit/utilities | 3.2.2 | CSS transform helpers | `CSS.Transform.toString()` for smooth drag animations. |
| @dnd-kit/modifiers | 9.0.0 | Constrain drag axis | `restrictToVerticalAxis` for section reorder; `restrictToWindowEdges` for palette drags. |

**Why dnd-kit over alternatives:**
- **vs React Beautiful DnD**: Atlassian officially discontinued it in 2023. Do not use.
- **vs React DnD**: Older, uses HTML5 DnD API which has poor touch support and no smooth animations
- **vs Pragmatic DnD** (Atlassian's new lib): Less mature ecosystem, less documentation
- dnd-kit handles the two distinct DnD patterns needed here: **palette→canvas drops** and **section reordering** using different primitives from the same library

**Confidence: HIGH** — npm versions confirmed live; dnd-kit is the current community standard.

---

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 22 LTS | Runtime | LTS stream, native `fetch`, ESM first-class. |
| Fastify | 5.8.5 | HTTP framework | v5 stable. ~3× faster than Express on benchmarks. First-class TypeScript, JSON schema validation built-in, plugin architecture. Better Auth has a first-party Fastify integration. |
| @fastify/cors | 11.2.0 | CORS handling | Required for Vite dev server → Fastify API requests. |
| @fastify/cookie | 11.0.2 | Cookie management | Needed by Better Auth for session cookies. |
| @fastify/multipart | 10.0.0 | File upload handling | For future image uploads (v1 uses URL refs, but keep the plumbing). |
| pino | 10.3.1 | Structured logging | Fastify's built-in logger. Zero config, JSON output, fastest Node logger. |
| zod | 4.4.3 | Runtime validation + type inference | Validate request bodies/params; `z.infer<>` drives TypeScript types. Zod v4 has performance improvements and new `z.string().url()` refinements. |

**Why Fastify over NestJS:**
- NestJS adds significant boilerplate, decorators, and reflection overhead for a tool that has ~10 API routes
- Fastify gives you framework-level performance with plugin modularity and no "Angular-like" ceremony
- Better Auth explicitly supports Fastify with a first-party guide

**Why Fastify over Express:**
- Express v5 is in beta (still); performance gap is real (~3×); TypeScript support is bolted-on not native

**Confidence: HIGH** — Fastify v5 confirmed stable; verified against Context7 Fastify docs.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16+ | Primary datastore | Relational structure fits newsletter→section→element hierarchy naturally. JSONB for flexible element content/config. |
| drizzle-orm | 0.45.2 | ORM / query builder | TypeScript-first, thin wrapper over SQL. `db.query.newsletters.findMany({ with: { sections: true } })` is immediately legible. No codegen step needed (unlike Prisma). |
| drizzle-kit | 0.31.10 | Schema migrations | `drizzle-kit push` for dev, `drizzle-kit migrate` for production. |
| postgres (postgres.js) | 3.4.9 | Database driver | Drizzle's recommended driver for PostgreSQL. Faster connection handling than `pg`; native ESM; clean async API. |

**Schema approach:**
- **Relational tables** for `users`, `newsletters`, `sections`, `elements`, `header_templates`, `footer_templates`
- **JSONB columns** on `elements.config` for storing element-specific properties (image URL, button style, etc.) without schema churn in v1
- Drizzle's `jsonb()` column type with TypeScript generics provides type-safe JSONB access

**Why Drizzle over Prisma:**
- Prisma requires a codegen step (`prisma generate`) which complicates CI and cold starts
- Drizzle queries are SQL-close, making the generated SQL predictable and debuggable
- Drizzle is lighter (no binary engine process), serverless-ready
- Prisma's type inference is improving but still lags Drizzle for complex joins

**Confidence: HIGH** — Drizzle 0.45.2 and postgres.js 3.4.9 confirmed; schema patterns verified via Context7 Drizzle docs.

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| better-auth | 1.6.14 | Auth framework (sessions, email/password, CSRF) | v1.6 stable. Handles the full auth lifecycle: sign-up, sign-in, session management, password reset. Native Fastify integration documented. Uses database sessions (not stateless JWT) which is correct for this use case. |

**Configuration note:**
Better Auth uses **database-backed sessions** by default (stores sessions in PostgreSQL alongside your schema). This is preferable to stateless JWT for a multi-user newsletter tool because:
1. Sessions can be revoked immediately (important for password reset flow)
2. No JWT secret rotation complexity
3. Drizzle adapter available — schema integrates cleanly

**Why not rolling-your-own JWT + `@fastify/jwt`:**
- JWT requires careful implementation of refresh token rotation, blacklisting, CSRF protection
- Better Auth handles all of this correctly out of the box
- `@fastify/jwt` is correct for service-to-service APIs, not user auth

**Why not Lucia:**
- Lucia v3 is maintained but is intentionally minimal — you build the email/password flow yourself
- Better Auth provides the same flexibility plus built-in email/password, sessions, and the Fastify adapter

**Confidence: HIGH** — Better Auth v1 confirmed stable; Fastify integration verified via Context7 Better Auth docs.

---

### Email Compatibility (Export Pipeline)

This section covers the HTML export that must render in Gmail, Outlook, and Apple Mail.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| juice | 12.1.0 | CSS inliner | Converts `<style>` blocks to inline `style=""` attributes on export. Required for Gmail (strips `<style>` tags). |

**Email HTML architecture:**

The builder must output **table-based, inline-styled HTML** — not modern CSS layouts.

| Rule | Rationale |
|------|-----------|
| Use `<table>` for columns, not `<div style="display:flex">` | Outlook (Windows) renders via Word engine; flexbox/grid not supported |
| All CSS must be inline on export | Gmail strips `<head><style>` blocks entirely |
| Max width `600px` | Standard email width; wider breaks mobile |
| `width` as HTML attribute on `<table>`, not just CSS | Outlook rendering quirk |
| Background colors via `bgcolor=""` attribute | Fallback for older Outlook |
| No custom web fonts (or fallback stack) | Gmail/Outlook ignore `@font-face` |
| Images: always set `width`/`height` attributes | Prevents layout collapse when images are blocked |
| Use `padding` not `margin` for spacing | Margin behavior inconsistent in Outlook |

**Export pipeline:**

```
Canvas document tree (Zustand state)
  → Build table-based HTML string (server-side template render)
  → Run juice CSS inliner
  → Deliver as .html download
```

**Why NOT MJML for this project:**
MJML is an abstraction layer that compiles its own XML-like template language to email-compatible HTML. In NL Layouter, the user is *building* the template visually — the canvas IS the template. Introducing MJML would mean converting the canvas state → MJML → HTML (two-step compilation), adding complexity without benefit. The correct approach is writing a direct canvas→HTML renderer with table-based output and running juice for CSS inlining.

**Why NOT inline CSS in the builder UI:**
The builder UI uses Tailwind utility classes for layout. On export, the server-side renderer builds a fresh HTML string from the document tree — it does not serialize the React DOM. Juice runs on this server-rendered export string only.

**Confidence: MEDIUM** — juice 12.1.0 confirmed; email compatibility rules are well-established (Litmus / Email on Acid documentation), HIGH confidence on the approach but email client behavior should be validated with real client testing.

---

## UI Component Strategy

Use **shadcn/ui** (CLI-based component installation, not the `shadcn-ui` npm package) on top of Radix UI primitives and Tailwind v4.

| Tool | Version | Purpose |
|------|---------|---------|
| shadcn/ui CLI | n/a (CLI tool) | Generates composable Radix-based components into `/components/ui/` |
| @radix-ui/react-dialog | 1.1.15 | Modal dialogs (rename newsletter, delete confirm) |
| @radix-ui/themes | 3.3.0 | Optional: Radix design tokens if shadcn components need theming |
| class-variance-authority | 0.7.1 | Variant-based component styling (button variants, etc.) |
| lucide-react | 1.17.0 | Icon library |

**Why shadcn/ui:** Components are copied into your project (not imported from a package), so you own the code. Fully customizable, no version lock-in, works perfectly with Tailwind v4 and Radix.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Rich text | TipTap v3 | Lexical (Meta) | Lexical is viable but TipTap has better ecosystem, docs, and React primitives for this use case |
| Rich text | TipTap v3 | Quill / Draft.js / Slate | All either deprecated (Draft.js), unmaintained (Quill), or too low-level (Slate) |
| DnD | dnd-kit | React Beautiful DnD | RBDnD officially discontinued by Atlassian 2023 |
| DnD | dnd-kit | React DnD | HTML5 DnD API = poor mobile support, no smooth animations |
| Backend | Fastify 5 | NestJS | NestJS is overkill for ~10 routes; adds decorator/DI ceremony |
| Backend | Fastify 5 | Express 5 | Express v5 still in beta; worse TypeScript; 3× slower |
| ORM | Drizzle | Prisma | Prisma codegen step; heavier runtime; weaker type inference |
| Auth | Better Auth | Lucia | Lucia is too minimal; requires building email/password flow manually |
| Auth | Better Auth | DIY JWT | Security pitfalls; session revocation is hard with stateless JWTs |
| Email export | juice + table HTML | MJML | MJML is an input language, not a renderer — wrong abstraction for a visual builder |
| State | Zustand | Redux Toolkit | Redux is overengineered; Zustand 5 handles complex nested state cleanly |
| Router | react-router 7 | TanStack Router | TanStack Router adds type-safe file routing (great for larger apps); react-router v7 is simpler for ~5-route SPA |
| CSS | Tailwind v4 | CSS Modules | Tailwind v4 utility-first is faster to build with; no naming decisions |

---

## Installation

### Frontend (Vite + React)

```bash
npm create vite@latest nl-layouter-client -- --template react-ts
cd nl-layouter-client

# Core UI
npm install tailwindcss @tailwindcss/vite react-router zustand immer
npm install @tanstack/react-query lucide-react clsx tailwind-merge class-variance-authority

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers

# TipTap rich text (v3)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extensions @tiptap/extension-list
npm install @tiptap/extension-image @tiptap/extension-text-style @tiptap/extension-color
```

### Backend (Fastify)

```bash
mkdir nl-layouter-server && cd nl-layouter-server
npm init -y

# Core framework
npm install fastify @fastify/cors @fastify/cookie @fastify/multipart

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install better-auth

# Validation and utilities
npm install zod dotenv nanoid

# Dev
npm install -D typescript tsx @types/node
```

---

## Key Version Notes

- **TypeScript 6.0.3**: Stricter defaults; `noImplicitAny` and `strictNullChecks` on by default in strict mode. Vite 8 requires TS ≥ 5.4.
- **Vite 8**: ESM-only; no CommonJS interop in vite config. Use `defineConfig` from `vite`.
- **Tailwind v4**: CSS-first config — `tailwind.config.js` is replaced by `@import "tailwindcss"` in your CSS. The `@tailwindcss/vite` plugin handles Tailwind v4 (no postcss config needed).
- **dnd-kit package versioning**: core (6.3.1), sortable (10.0.0), modifiers (9.0.0) have independent major versions since late 2024. This is intentional — they are compatible.
- **TipTap v3**: Consolidates packages. `@tiptap/extensions` replaces individual `@tiptap/extension-focus`, `@tiptap/extension-placeholder`, `@tiptap/extension-history` packages. Do not mix v2 and v3 packages.
- **Zod v4**: Performance improvements; some API surface changes from v3. Use `z.object().parse()` and `z.infer<>` as before; `z.string().url()` is still valid.

---

## Sources

| Source | Confidence | URL |
|--------|------------|-----|
| TipTap v3 docs (Context7) | HIGH | https://github.com/ueberdosis/tiptap-docs |
| TipTap v2→v3 migration guide | HIGH | https://github.com/ueberdosis/tiptap-docs/blob/main/src/content/guides/upgrade-tiptap-v2.mdx |
| Fastify docs (Context7) | HIGH | https://github.com/fastify/fastify |
| Drizzle ORM PostgreSQL guide (Context7) | HIGH | https://github.com/drizzle-team/drizzle-orm-docs |
| Better Auth Fastify integration (Context7) | HIGH | https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/fastify.mdx |
| Zustand docs (Context7) | HIGH | https://github.com/pmndrs/zustand |
| React 19 blog post (Context7) | HIGH | https://github.com/reactjs/react.dev/blob/main/src/content/blog/2024/12/05/react-19.md |
| npm registry (all versions) | HIGH | live registry query, 2026-06-05 |
