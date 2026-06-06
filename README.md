# NL Layouter

A web-based drag-and-drop HTML newsletter builder. Users can build fully structured,
export-ready HTML newsletters without writing any code.

**Stack:** React 19 · Vite 8 · Fastify 5 · Drizzle ORM · PostgreSQL · TypeScript strict · Tailwind v4

---

## Quick Start

### Prerequisites

- Node.js 22 LTS
- pnpm (`npm install -g pnpm`)
- A [Neon.tech](https://neon.tech) free account (cloud PostgreSQL — no Docker needed)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example apps/server/.env
```

Edit `apps/server/.env` and replace the `DATABASE_URL` placeholder with your
real Neon.tech connection string (from Neon Dashboard → Project → Connection Details).

### 3. Push the database schema

```bash
cd apps/server
pnpm drizzle-kit push
cd ../..
```

Expected output: `No schema changes detected` or `Changes applied` — either is success.

### 4. Start both apps

```bash
pnpm dev
```

This runs client and server concurrently:

| App | URL |
|-----|-----|
| Client (Vite) | http://localhost:3000 |
| Server (Fastify) | http://localhost:3001 |

Verify the server is running:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

---

## Project Structure

```
NL_Layouter/
├── apps/
│   ├── client/          # Vite 8 + React 19 + TypeScript
│   │   └── src/
│   │       ├── types/   # NewsletterDoc canonical types
│   │       ├── dnd/     # DRAG_TYPES constants
│   │       ├── editor/  # TipTap v3 extension config
│   │       └── store/   # Zustand + Immer canvas state
│   └── server/          # Fastify 5 + Drizzle ORM
│       └── src/
│           ├── db/      # Drizzle connection + schema
│           └── config.ts # Zod-validated env config
├── .env.example         # Copy to apps/server/.env
├── docker-compose.yml   # Local PostgreSQL (future use)
├── tsconfig.base.json   # Shared TypeScript strict config
└── pnpm-workspace.yaml  # pnpm monorepo
```

---

## Development

```bash
pnpm dev          # Start both client + server
pnpm typecheck    # TypeScript check on all packages
pnpm build        # Production build
```

Per-app commands:
```bash
pnpm --filter ./apps/client dev
pnpm --filter ./apps/server dev
pnpm --filter ./apps/client test --run
```

---

## Database

- **Dev:** Neon.tech cloud PostgreSQL (connection string in `apps/server/.env`)
- **Future local dev:** `docker compose up` (requires Docker Desktop)
- **Schema changes:** `cd apps/server && pnpm drizzle-kit push`

---

## Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & Stack Setup | ✅ Complete |
| 2 | Newsletter CRUD & Dashboard | ⬜ Next |
| 3 | Canvas Shell & Layout Rendering | ⬜ |
| 4 | DnD — Row-Level Operations | ⬜ |
| 5 | DnD — Element Placement | ⬜ |
| 6 | Image & Button Elements | ⬜ |
| 7 | Rich Text, Divider & TipTap | ⬜ |
| 8 | Header/Footer Presets & Pre-header | ⬜ |
| 9 | HTML Export Pipeline | ⬜ |
