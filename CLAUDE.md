# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multi-exam simulation and prep platform ("Exam Operating System"): Learn →
Practice → Simulate → Score → Diagnose → Improve → Retake. Adding a new exam
must be a content/config operation, never a code change — the exam engine is
fully generic (see Architecture below). Monetization is attempt-credit based
(a ledger), not subscription-based.

Stack: NestJS + TypeScript + Prisma on Supabase Postgres (`apps/api`),
Next.js App Router (`apps/web`), a React Native/Expo mobile app (`mobile`,
Android + iOS from one codebase), a small shared enum/DTO package
(`packages/shared-types`), npm workspaces monorepo.

## Commands

Install once from the repo root: `npm install` (installs all workspaces).

### Environment setup

- `apps/api/.env` — `DATABASE_URL` (pooled, port 6543, `?pgbouncer=true`),
  `DIRECT_URL` (direct, port 5432, migrations only), `JWT_SECRET`,
  `JWT_EXPIRES_IN`, `PORT=3001`, `SEED_PASSWORD`. See `.env.example` at the
  repo root for the full template, including the `apps/api/.env.test` and
  `apps/web/.env.local` blocks.
- The direct host (`db.<ref>.supabase.co`) is IPv6-only and typically
  unreachable from this kind of dev network — only used for migrations, which
  go through Prisma's `directUrl`, not the app itself.
- The pooled connection intermittently returns P1001/"Can't reach database
  server" or "Unable to start a transaction in the given time" even when the
  DB is fine — this is normal for this project's Supabase tier, not a code
  bug. Wrap `prisma migrate`/`db seed`/e2e runs in a retry loop when scripting
  them.

### Database

```bash
cd apps/api
npx prisma migrate dev --name <name>   # schema change + auto prisma generate
npx prisma db seed                     # idempotent: catalogue exams + demo users
```

Seeded accounts (password = `SEED_PASSWORD`): admin `craigozor79@gmail.com`,
student `student@example.com`.

**Stop the API server before running `prisma generate`/`migrate`** — on
Windows the running process locks the query-engine DLL and the command fails
with EPERM.

### Running the apps

Do **not** run `nest start --watch` / `next dev` / any `npm run dev` as a
long-lived background task in this environment. `TaskStop`-style cancellation
only kills the npm wrapper process, not the underlying watcher, which leaks
child processes that then fight over `dist/` and port 3001 and cause OOM /
restart loops. Instead, build once and run the compiled output directly:

```bash
# API
cd apps/api && npx nest build && node dist/src/main   # http://localhost:3001/api, Swagger at /api/docs

# Web
cd apps/web && npx next build && node ../../node_modules/next/dist/bin/next start -p 3000   # http://localhost:3000
```

Rebuild and restart the relevant app after any backend or frontend change —
there is no watch/hot-reload in this workflow.

### Testing

```bash
cd apps/api
npx jest                                              # unit tests (pure, DB-free utils) — safe to run anytime
npx jest src/organizations                            # a single suite/dir
npx jest --config ./test/jest-e2e.json --runInBand    # e2e — needs DATABASE_URL/DIRECT_URL pointed at a TEST schema (?schema=test), not dev
```

Never run the API dev/prod server and the e2e suite against the same
database at the same time — they'll deadlock/contend on the pooler's limited
connections (`connection_limit=5`).

### Typecheck / build

```bash
cd apps/api && npx tsc --noEmit -p tsconfig.json
cd apps/web && npx tsc --noEmit
```

Both `npx nest build` and `npx next build` also serve as full compile checks.

### Mobile (`mobile`)

```bash
cd mobile
npx tsc --noEmit                                          # typecheck (also what `npm run build` runs - no real bundler step)
npx expo export --platform android --output-dir <dir>      # real production JS bundle - the actual "does it build" check
```

There's no Android Studio/Xcode in this environment, so day-to-day
verification uses Expo's **web** target instead of an emulator — it's a
genuine run of the app (same code, same screens), not a mock:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:3001/api npx expo start --web --port 8090
```

Two native-only APIs have zero web implementation and can't be exercised
this way: `expo-secure-store` (session persistence — silently no-ops on web,
so a hard page reload always looks logged out there even though Keychain/
Keystore persist correctly on a real device) and `Alert.alert` (a literal
`{}` stub on web — confirm dialogs never fire; route around it with a
temporary test-only button when verifying an Alert-gated flow, and delete it
afterward). Neither is a bug — both work as intended on iOS/Android.

To test on a physical Android/iOS device via Expo Go, point the app at the
dev machine's LAN IP (not `localhost`, which only resolves on the machine
itself), then run the normal dev server and scan its QR code:

```bash
# find the LAN IP first (Windows): Get-NetIPAddress -AddressFamily IPv4
cd mobile
$env:EXPO_PUBLIC_API_URL="http://<lan-ip>:3001/api"; npx expo start
```

Both devices must be on the same network, and Windows Firewall's first-run
prompt for Node.js must be allowed or the phone can't reach Metro/the API.

Like `nest --watch`/`next dev` above, don't assume a `TaskStop`-cancelled
`expo start`/`expo start --web` is actually gone — the same npm-wrapper-vs-
child-process gap applies, and a stray process can keep squatting on its port
after being "stopped." This looks identical to "the app can't reach the
server" from the phone's side, but is actually just no dev server running at
all. Check with `Get-CimInstance Win32_Process | Where-Object CommandLine
-match 'expo start'` (Windows) before assuming the API or network config is
the problem.

### Shared types package

`packages/shared-types` ships compiled `dist/` output that `apps/api` imports
from (`@examproject/shared-types`) — it is **not** read live from `src/`.
After editing `packages/shared-types/src/enums.ts` (or anything else in that
package), rebuild it before the API will see the change:

```bash
npm run build -w @examproject/shared-types
```

## Architecture

### The generic content engine

`Exam` → `ExamVersion` (versioned config: duration, navigation rules,
scoring strategy, optional question-sampling `blueprint`) → `Topic`
(self-referential, unlimited depth, scoped per version) → `Question` (5
types, many-to-many with topics via `QuestionTopic`, status workflow
`DRAFT → IN_REVIEW → APPROVED → PUBLISHED → RETIRED`). **Publishing an
`ExamVersion` freezes its config and topic tree** — to change either, create
a new version. This model is why adding a new exam is pure data (seed
scripts under `apps/api/prisma/seed-*.ts` and `bank-*.ts`/`saa-bank-*.ts`
question banks), never a code branch on exam identity.

`Exam.organizationId` (nullable) marks a private, org-owned exam: excluded
from the public catalogue (`ExamsService.findCatalogue*` filters
`organizationId: null`) and only attemptable by that org's active members.

### Attempts are immutable snapshots

`AttemptsService.start()` (`apps/api/src/attempts/attempts.service.ts`) never
lets a later edit to a `Question`/`ExamVersion` change a past attempt:
`AttemptSnapshot` freezes the version config, and each `AttemptQuestion`
carries a full frozen `snapshot` JSON of the question (`questionId` is a soft
reference for analytics only). Timers are server-authoritative — every
read/write path calls `applyLazyExpiry()` first rather than trusting a
client-reported remaining time. Grading happens once, on submit/expiry
(`ScoringModule`), and is never recomputed. `mode` is `SIMULATION` (costs a
credit) or `PRACTICE` (free, allows instant per-question feedback via
`checkAnswer`).

### Credit ledger

Never a mutable "credits remaining" counter. `Product` (what's sold/granted,
including the `FREE` plan) → `Purchase` → `CreditLot` (`remaining` decremented
transactionally) → `CreditTransaction` (append-only audit trail, one row per
lot mutation). `CreditsService` (`apps/api/src/credits/credits.service.ts`):

- `reserveLot`/`pickLot` (`lot-selection.util.ts`, pure/unit-tested): full-exam
  lots before limited ones, soonest-expiry first, EXAM-scope before GLOBAL,
  oldest first. Excludes `ORG_GRANT`-sourced lots — those are only spendable
  through the org access-code path, never silently auto-picked.
- `debitLot` guards against double-spend with a conditional
  `updateMany({ where: { remaining: { gt: 0 } } })` + count check, **and**
  every credit-consuming flow first takes a per-user Postgres advisory lock
  (`lockUserCredits`, `pg_advisory_xact_lock(hashtext(userId))`) inside the
  same transaction as the attempt creation — belt-and-suspenders against two
  devices racing to spend one credit.
- **Any new `$transaction` call in this codebase must pass `TX_OPTIONS`**
  (`{maxWait: 15000, timeout: 30000}`, exported from `credits.service.ts`).
  The Prisma default timeout is too short for this environment's pooler and
  will intermittently throw "Unable to start a transaction in the given
  time" under real latency — this has caused real bugs before.
- **Never nest a `this.prisma.$transaction(...)` call inside another
  already-open transaction.** Several `CreditsService` methods
  (`grantFreePlan`, `adminAdjust`, ...) are opinionated public wrappers that
  open their own top-level transaction; each has a `*InTx`/`adjustLotInTx`-
  style sibling that takes an already-open `tx: Prisma.TransactionClient` for
  callers that need to compose it into a larger transaction (e.g.
  `OrganizationsService.addMember` granting the free plan atomically with
  account creation). Calling the public wrapper from inside another
  transaction silently breaks atomicity and can error under connection
  pressure — always use the `*InTx` variant in that situation, or add one if
  it doesn't exist yet.
- **Public pricing is a fixed 4-tier structure** (Basic/Silver/Gold/Premium,
  seeded in `prisma/seed.ts` and `seed-catalogue.ts`). `listActiveProducts`
  includes the `FREE` (Basic) product so `/pricing` is fully data-driven
  across all tiers, but `purchase()` still rejects buying it directly — it's
  only ever granted via `grantFreePlan`. There is no literal "unlimited" in
  the schema (`credits` is a required, non-nullable `Int`); a practically-
  unlimited tier is instead a large number (100,000) plus a server-computed
  `unlimited: boolean` flag (`UNLIMITED_CREDITS_THRESHOLD = 50_000`) threaded
  through `listActiveProducts`, `getWallet` (per-lot and wallet-level), and
  `Dashboard.creditsUnlimited` for *display only* — `debitLot`/`pickLot` stay
  magnitude-agnostic and untouched. Any per-attempt-price comparison (e.g. a
  "best value" badge) must exclude both `priceCents === 0` and `unlimited`
  products or they trivially "win" the comparison — this has already caused
  a real bug once, in the homepage and `/pricing`'s cheapest-per-attempt
  calculations.

### Organizations (B2B)

`Organization` → `OrganizationMember` (`orgRole`: `ORG_ADMIN`/`ORG_MEMBER`,
one org per user) → `OrganizationExamAccessCode` (a one-time PIN, sha256-
hashed, 1:1 paired with a dedicated `CreditLot`). An org provisions member
accounts itself (temp password shown once) and grants exam access (PIN shown
once); the PIN gates spending that specific lot and is required at attempt
start, on top of normal login — see the 3-way branch (`ORG_OWNED_FREE` /
`ORG_GATED_CODE` / `STANDARD_CREDIT`, `org-access.util.ts`) near the top of
`AttemptsService.start()`. Org-scoped authority isn't expressible with the
global role-based `RolesGuard`, so `OrganizationsService` resolves and checks
org membership/ownership explicitly in each method
(`requireCallerOrg`, `assertOwns*`) rather than via a decorator — the same ad
hoc pattern used elsewhere for state checks (e.g.
`TopicsService.assertVersionIsDraft`). The org-scoped exam CMS
(`OrgExamsController`) is a deliberately separate, thin controller that
delegates to the same `ExamsService`/`TopicsService`/`QuestionsService` the
platform admin CMS uses, rather than modifying those controllers' `@Roles()`
gates.

### Tutors (verified directory + weak-topic matching)

`TutorProfile` (one per `User`, `status`: `DRAFT → PENDING_REVIEW →
APPROVED`/`REJECTED`) → `TutorSpecialization` (`examId` + optional
`topicKeyword`; `null` keyword means "any topic in this exam"). A tutor
self-registers (`AuthService.registerTutor`), builds their profile
(`TutorsService`, identity-scoped via `requireCallerProfile` — same
ad hoc ownership-check pattern as `OrganizationsService.requireCallerOrg`,
not a `@Roles()` guard), uploads a photo and resume, and submits for admin
review; only a platform `ADMIN` (`AdminTutorsController`) can approve/reject.
Only `APPROVED` profiles are ever returned by the public endpoints
(`PublicTutorsController`) or matched to students — `publicGetById` 404s on
anything else so unapproved state never leaks.

Specializations deliberately key off `examId`, not a `Topic` FK: `Topic`
rows are re-created on every republished `ExamVersion` (see the content
engine above), so a stable `Exam` + free-text keyword is matched at read
time against `DashboardService`'s already-computed `weakTopics`
(`examSlug`/`title`), not stored as a foreign key into a churning tree. The
match itself is a pure, unit-tested util (`tutor-matching.util.ts`,
`matchesWeakTopic`/`rankMatches`) called from `DashboardService.forUser`
and attached to the dashboard payload as `tutorSuggestions` — student-facing
UI shows contact-worthy profile info only; there is no in-app messaging,
booking or payment flow.

### Auth & RBAC

Stateless JWT (`sub`/`email`/`role` payload), bcrypt cost 12. `Role` is
`STUDENT | ADMIN | ORG_ADMIN | TUTOR` and is hand-duplicated between
`prisma/schema.prisma` and `packages/shared-types/src/enums.ts` (`apps/api`
imports `Role` from the shared package, not `@prisma/client`) — **changing
it means editing both and rebuilding shared-types**. `JwtAuthGuard` +
`RolesGuard` are global (`APP_GUARD` in `app.module.ts`); opt out per-route
with `@Public()`, restrict with `@Roles(Role.X)`. Anything needing
resource-ownership (not just role) is checked ad hoc inside the service
method, not the guard layer.

### Transactional email & password reset

`MailService` (`apps/api/src/mail/mail.service.ts`, exported by `MailModule`)
wraps Resend and is fire-and-forget by design — `send()` catches and logs
every error itself, so a missing `RESEND_API_KEY` or a Resend outage never
breaks registration/login/password-reset. Without `RESEND_API_KEY` set, it
logs what it would have sent instead of calling the API — this is the normal
local-dev state, not a misconfiguration. Callers invoke it with `void
this.mailService.send...(...)` (not `await`) for the same reason.

Password reset (`AuthService.forgotPassword`/`resetPassword`) stores only a
bcrypt hash of a 6-digit code (`PasswordResetCode`, `password-reset.util.ts`'s
`generateResetCode`/`RESET_CODE_TTL_MS` = 15 min), never the code itself.
`forgotPassword` always returns the same message regardless of whether the
email exists (matching `login()`'s existing non-enumerating precedent) and
invalidates any prior unconsumed code for that user before issuing a new one.

### Branding

`BRAND_NAME`/`BRAND_TAGLINE` live in `apps/web/src/lib/brand.ts` and
`mobile/src/lib/brand.ts` as separate, hand-duplicated constants (same
pattern as the `Role` enum and the `api-client.ts` interfaces below) — a
rebrand means editing both, not just one.

### Frontend patterns (`apps/web`)

- `lib/auth-context.tsx` — JWT + user kept in `localStorage`
  (`examproject.session`); exposes a `ready` flag so pages can avoid
  redirecting to `/login` before the client has hydrated from storage.
- `lib/api-client.ts` — `apiFetch`/`authFetch` wrap all API calls;
  `ApiError` carries `status` (0 = network-level failure, no HTTP response
  at all) and an optional machine-readable `code` (e.g.
  `ORG_ACCESS_CODE_REQUIRED`) the UI can branch on without parsing the
  human-readable message.
- Role-gated pages use a client-side "Gate" component per role
  (`AdminGate`, `OrgGate`) that redirects/shows a message — this is a
  courtesy only; the server enforces the real check on every endpoint.
- `/attempts/[id]` is a focus-mode shell with no site header/footer
  (`SiteShell` matches the route and skips chrome).
- Design tokens support light/dark via `prefers-color-scheme` and a
  `data-theme` override; dataviz follows fixed rules (single-series = blue
  bars, status is always icon + label not color alone, ring gauge for a
  single headline number) documented inline in `globals.css`.
- **Any Server Component that does `someFetch().catch(() => fallback)` must
  call `rethrowIfDynamicServerUsage(error)` first inside that catch
  callback** (`lib/api-client.ts`). Next.js throws a control-flow
  `DynamicServerError` (`digest === "DYNAMIC_SERVER_USAGE"`) internally when
  a `no-store` fetch runs during static-rendering detection; swallowing it in
  an app-level `.catch()` breaks Next's own dynamic-rendering fallback and
  silently renders an empty/fallback state instead of the real data — this
  previously made exams/pricing/the homepage all appear empty in production
  (Netlify) while working fine with `next start` locally, since that code
  path isn't exercised the same way there.

### Mobile app (`mobile`)

React Native + Expo (Expo Router, file-based routes under `mobile/app/**`),
a pure REST client of the same `apps/api` — no separate backend, no local
database beyond a cached JWT session (`expo-secure-store`, the
`expo-secure-store`-backed analogue of the web's `localStorage` session).
`mobile/src/lib/api-client.ts` and `tutor-api.ts` mirror `apps/web/src/lib`'s
functions/types 1:1 so both clients stay in sync by construction; env config
(`EXPO_PUBLIC_API_URL` / `app.config.ts`'s `extra.apiUrl`) is independent of
the web app's `NEXT_PUBLIC_API_URL`. `mobile` is registered as a genuine npm
workspace (root `package.json`'s `workspaces` array) purely so it can import
`@examproject/shared-types` the normal way — this is the only touch-point
outside the `mobile/` folder itself, and it's additive/zero-behavior-impact
on `apps/api`/`apps/web` (verified: both typecheck/build/test identically
before and after, and `mobile`'s own build runs as a fully isolated
workspace step — breaking it doesn't block or affect the other three).

Current coverage: full parity with the web app's own screens across all four
roles — student (auth, dashboard, exam catalogue, practice/simulation
attempts, results including the per-attempt tutor suggestion card, review,
tutor directory, wallet), tutor (profile editor, photo/resume upload,
specializations, submit-for-review), org admin (profile/logo, mission
statement, members, exam-access codes, custom exam creation), and platform
admin (hub, credits/grants/refunds, tutor moderation, exams & topic tree,
audit log). The one deliberate, explicitly-scoped exception: the
exam-version question editor (`admin/versions/[id].tsx`) supports reviewing
questions and moving them through their status transitions
(approve/reject/publish/retire), but not authoring new structured question
content — that stays web-only, per the original build plan's CMS scope-down.

Known follow-up, not yet done: a handful of compact/secondary actions built
as ad-hoc `Pressable`s rather than the shared `PrimaryButton`/`SecondaryButton`
components (e.g. the "Manage"/"Revoke" buttons in `org/members.tsx` and
`admin/credits.tsx`) don't have `accessibilityRole`/`accessibilityLabel` set,
unlike the shared button components in `ui.tsx` (which do, deliberately, for
screen-reader support). Worth a follow-up pass to standardize.

Android renders edge-to-edge by default on this Expo SDK (no opt-out —
Android 15+ enforces it), meaning content draws *under* the system gesture
bar unless a screen explicitly pads for it. `_layout.tsx` wraps the app in
`SafeAreaProvider`; the shared `Screen` component and any screen with its
own fixed (non-scrolling) bottom bar — currently just
`attempts/[id]/index.tsx`'s Previous/Next/Submit row — read
`useSafeAreaInsets().bottom` and pad accordingly. Any new fixed-to-the-bottom
UI needs the same treatment, or it'll sit behind the nav bar on real
devices (invisible in the web-preview target, since browsers have no
concept of this).

## Content/scope notes

AI features, B2B school hierarchies beyond the Organizations module above,
bulk CSV import, and general object storage were cut from scope early on. The
exception is a handful of narrow, minimal local-disk upload surfaces —
org logos, tutor photos, tutor resumes — each served statically from its own
`apps/api/uploads/<type>/` directory (`main.ts` loops over an explicit list
of `[dirName, urlPrefix]` pairs; there is no general-purpose upload endpoint)
rather than reintroducing cloud object storage. Treat this as a deliberate,
scoped exception, not a precedent for adding more file upload surfaces
casually — a new one still means a new named directory, its own
`fileFilter`/`limits.fileSize`, and an explicit static-assets prefix, not a
generic passthrough.

Exam question banks under `apps/api/prisma/*.ts` are original content written
for this project (not scraped from real exams or third-party dumps) with
independence/non-affiliation disclaimers baked into each exam's
`description` field — keep new exam content to the same standard.
