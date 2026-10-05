# CERTCITY — multi-exam simulation platform

"Your No. 1 global exam simulator." An "Exam Operating System": Learn →
Practice → Simulate → Score → Diagnose → Improve → Retake. Adding a new exam
is a content/config operation, never a code change — the exam engine
(`Exam` → `ExamVersion` → `Topic` → `Question`) is fully generic. Monetization
is attempt-credit based (a ledger: `Product` → `Purchase` → `CreditLot` →
`CreditTransaction`), not subscription-based. See [CLAUDE.md](CLAUDE.md) for
the full architecture writeup.

## Stack

- **API**: NestJS + TypeScript, Prisma, PostgreSQL (Supabase-hosted), JWT auth.
- **Web**: Next.js (App Router).
- **Mobile**: React Native + Expo (Android + iOS), a REST client of the same API.
- **Monorepo**: npm workspaces (`apps/*`, `packages/*`, `mobile`).

## Prerequisites

- Node.js 20+
- A Supabase project for **dev** (Postgres). E2e tests truncate all tables
  between runs, so they point at an isolated Postgres **schema** (`test`) via
  `?schema=test` on the same project's connection string, rather than your
  default `public` schema — see `apps/api/.env.test`. (A fully separate
  Supabase project gives stronger isolation if you ever want it, but same
  project + separate schema is enough to keep e2e runs from touching your
  dev data.)

## Setup

1. `npm install` (installs all workspaces).
2. Copy `.env.example` to `apps/api/.env` and fill in your **dev** Supabase
   connection strings (`DATABASE_URL` = pooled/6543, `DIRECT_URL` = direct/5432),
   a `JWT_SECRET`, and a `SEED_PASSWORD`.
3. Copy the `TEST_DATABASE_URL`/`TEST_DIRECT_URL` block into `apps/api/.env.test`
   pointing at your **test** Supabase project, then export
   `DATABASE_URL=$TEST_DATABASE_URL` and `DIRECT_URL=$TEST_DIRECT_URL` (or use a
   tool like `dotenv-cli`) before running the e2e suite.
4. Create `apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001/api`.

## Database

```bash
cd apps/api
npx prisma migrate dev --name <name>   # schema change + auto prisma generate
npx prisma db seed                     # idempotent: catalogue exams, question banks, pricing products, demo users
```

Seeded accounts (password = `SEED_PASSWORD` from your `.env`):
- Admin: `craigozor79@gmail.com`
- Student: `student@example.com`

**Stop the API server before running `prisma generate`/`migrate`** — on
Windows the running process locks the query-engine DLL and the command fails
with EPERM.

## Running

This project does **not** use watch/dev servers day-to-day (see
[CLAUDE.md](CLAUDE.md) for why — `TaskStop`-style cancellation only kills the
npm wrapper, not the underlying watcher, leaking child processes). Build once
and run the compiled output directly, rebuilding after each change:

```bash
# API
cd apps/api && npx nest build && node dist/src/main   # http://localhost:3001/api, Swagger at /api/docs

# Web
cd apps/web && npx next build && node ../../node_modules/next/dist/bin/next start -p 3000   # http://localhost:3000
```

For mobile (Expo), see the "Mobile" section in [CLAUDE.md](CLAUDE.md) —
day-to-day verification uses Expo's web target or a physical device via
Expo Go, pointed at the dev machine's LAN IP.

## Testing

```bash
cd apps/api
npx jest                                              # unit tests — no DB needed
npx jest --config ./test/jest-e2e.json --runInBand    # e2e — needs DATABASE_URL/DIRECT_URL pointed at a TEST schema, not dev
```

Never run the API server and the e2e suite against the same database at the
same time — they contend on the pooler's limited connections.

## What's built

Auth (register/login/RBAC across `STUDENT`/`ADMIN`/`ORG_ADMIN`/`TUTOR`),
audit log, the generic exam/topic/question content engine with a status
workflow and versioned, publish-locked configs, attempts (practice and
timed/scored simulation, immutable snapshots, server-authoritative timers),
scoring, the attempt-credit ledger with a 4-tier public pricing structure
(Basic/Silver/Gold/Premium), an Organizations (B2B) module with member
provisioning and exam-access codes, a verified tutor directory with
weak-topic matching, and a React Native/Expo mobile app with feature parity
across all four roles. See [CLAUDE.md](CLAUDE.md)'s Architecture section and
"Content/scope notes" for what was deliberately cut from scope (AI features,
bulk CSV import, general object storage beyond a few narrow upload surfaces).
