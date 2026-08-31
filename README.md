<div align="center">

# 🌾 Çiftlik Pro

**A multi-tenant SaaS Farm Management System (ERP).** Every farm owner signs up,
gets a fully isolated tenant, and runs the whole operation — livestock, fields,
inventory, finance, sales, a public storefront, tasks and staff — from one
role-based dashboard.

[![CI](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YusufKosarDev/ciftlik-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/YusufKosarDev/ciftlik-pro)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/tests-304%20unit%20%2B%2030%20e2e-success)](#testing--quality)
[![Multi-tenant](https://img.shields.io/badge/multi--tenant-Postgres%20RLS-4169E1)](#multi-tenancy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Live demo: [ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app)** &nbsp;·&nbsp;
**pick a role** on the sign-in screen — Admin, Worker, Vet or Accountant

<sub>The demo opens in your browser's language; use the TR/EN switch in the header to change it.</sub>

🇹🇷 **[Türkçe README](README.tr.md)**

</div>

---

## 🎬 Çiftlik Pro in 60 seconds

Sign in → dashboard → animal list (server-side search) → animal detail (milk and
weight charts) → 2D farm map → calendar → finance → dark mode → farm storefront:

![Çiftlik Pro demo tour](docs/demo.en.gif)

---

## Why this project is interesting

The hard part of a multi-tenant SaaS is not the CRUD — it is making a data leak
between tenants **structurally impossible**. One forgotten `where: { tenantId }`
is a breach, and code review does not scale as a defence across ~47 write
endpoints.

So isolation is enforced twice, in two independent layers:

1. **PostgreSQL Row-Level Security** — every tenant table has `ENABLE` + `FORCE`
   row level security and a `tenant_isolation` policy
   (`tenantId = current_setting('app.tenant_id')`, plus `WITH CHECK` on writes).
   If a query forgets its filter the database returns nothing, not someone else's
   data.

   A policy is worth exactly as much as the role it applies to, so this one is
   proven rather than asserted: CI provisions `ciftlik_app` — `NOSUPERUSER
   NOBYPASSRLS` — on every push and runs the isolation suite through it. The
   hosted demo runs without that second layer, because Neon's free tier offers no
   role that is both reachable through its connection proxy and outside
   `neon_superuser`. Both attempts and why each one failed are written down in
   [PRODUCTION-RLS.md](docs/PRODUCTION-RLS.md#neon-limitation).

2. **A Prisma Client Extension** that injects `tenantId` into every list, count,
   aggregate and bulk-write `where`. This layer is for ergonomics; the database is
   the guarantee.

The tenant context is set with `SET LOCAL app.tenant_id` **inside an interactive
transaction** — a session-level `SET` would leak across requests behind a
connection pooler (pgbouncer), which is exactly the bug the design exists to
prevent.

This is verified, not asserted — and verified **on every push and pull request**,
not just on a developer's machine: a dedicated CI job creates the non-superuser
role and runs integration tests against a real PostgreSQL instance as that role,
proving that tenant A cannot reach tenant B's rows via `findMany` *or*
`findUnique`, and that with no context set **zero** rows are visible — the system
fails closed.

The two reads that legitimately happen *before* a tenant context exists — finding
a user by email at sign-in, and opening an invitation link by token — go through
`SECURITY DEFINER` functions, so no tenant table needs an exemption from RLS.

> 📐 The full reasoning, the alternatives that were rejected, and the known
> limitations are in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Screenshots

**Dashboard** — sidebar layout, summary cards with real month-over-month deltas,
and a monthly income/expense chart:

![Dashboard](docs/screenshots/en/dashboard.png)

| 🌙 Dark mode | 🛒 Farm storefront (`/magaza/[slug]`) |
| ------------ | ------------------------------------- |
| ![Dark mode](docs/screenshots/en/dashboard-dark.png) | ![Storefront](docs/screenshots/en/store.png) |

| 💳 Billing — plan & usage limits | 👥 Staff — invitations & roles |
| -------------------------------- | ------------------------------ |
| ![Billing](docs/screenshots/en/billing.png) | ![Staff](docs/screenshots/en/staff.png) |

| Animals (server-side searchable table) | Animal detail (milk / weight charts) |
| -------------------------------------- | ------------------------------------ |
| ![Animals](docs/screenshots/en/animals.png) | ![Animal detail](docs/screenshots/en/animal-detail.png) |

| 2D farm map | Calendar (vaccinations / tasks / harvest / births) |
| ----------- | -------------------------------------------------- |
| ![Map](docs/screenshots/en/map.png) | ![Calendar](docs/screenshots/en/calendar.png) |

---

## Features

- **Multi-tenant SaaS** — each owner signs up and runs an isolated farm; data
  never crosses tenants. See [Multi-tenancy](#multi-tenancy).
- **Auth & RBAC** — Auth.js (NextAuth v5) with four roles (Admin, Worker, Vet,
  Accountant), enforced from one place at the edge, the page and the API.
  Public farm sign-up creates tenant + owner admin in a single transaction; staff
  join through tokenized, single-use, time-limited invitations.
- **Billing & plan limits** — FREE vs PRO with enforced limits (active animals,
  staff seats), env-gated Stripe subscription checkout with a webhook that flips
  `Tenant.plan`, and a usage dashboard. **GDPR/KVKK self-service:** full tenant
  export (JSON) and account deletion.
- **Livestock** — records, health history, vaccination schedule with due-date
  alerts, milk yield trends, weight/growth tracking, breeding and lineage
  (offspring ↔ mother).
- **Fields & crops** — planting/harvest records, per-crop cost/revenue and yield
  per decare, plus a 2D farm map you can drag to lay out.
- **Inventory & feed** — feed/medicine/equipment with critical-level alerts;
  feed consumption deducts stock **atomically** (a conditional `updateMany`
  guards against TOCTOU, so stock can never go negative).
- **Finance** — income/expense, net balance, monthly chart, category breakdown
  computed in the database, CSV export.
- **Sales & customers** — every sale automatically posts a linked income
  transaction in the same transaction, so the books always match.
- **Storefront & orders** — a public per-tenant catalogue (`/magaza` directory →
  `/magaza/[slug]`), a slug-scoped cart, and multi-line orders with price/name
  snapshots. Stripe checkout when configured, pay-on-delivery otherwise.
- **Calendar, tasks and staff** — vaccinations, tasks, harvests and births in one
  monthly view; task assignment with overdue warnings.
- **Modern UI** — sidebar layout, dark mode via semantic tokens, a ⌘K command
  palette, and a `cva`-based design system.
- **Onboarding tour** — a role-specific, multi-step welcome modal on the first
  visit to the dashboard; restartable at any time from the profile page.
- **Bilingual (TR/EN), end to end** — every screen and every API error message,
  in **all 826 translation keys** across both catalogues: the panel, the public
  storefront and cart, billing, invitations, the 404 and error boundaries, and
  the responses a write endpoint returns. Dates, currency and chart month labels
  follow the active locale too. A first-time visitor gets their **browser's
  language** (`Accept-Language`); the switcher in the header — or on the profile
  page — pins a choice in a cookie from then on. The two exceptions are
  deliberate: farm data belongs to the tenant who typed it, and the daily digest
  email has no viewer whose language to read.
- **Email alerts** — a daily cron emails each tenant's admins a digest of critical
  stock, overdue tasks and upcoming vaccinations (Resend).

---

## Engineering highlights

- **Two-layer tenant isolation** (Postgres RLS + Prisma extension), pgbouncer-safe
  `SET LOCAL`; the RLS layer runs under a `NOSUPERUSER NOBYPASSRLS` role in CI on
  every push, and the hosting limit that leaves it dormant on the demo is
  documented rather than glossed over.
- **One authorization source** (`src/lib/authz.ts`) applied at three levels: edge
  proxy (real `307` before rendering), server pages, and every write endpoint.
- **End-to-end type safety** — Zod validates on both client and server; Prisma
  types the database.
- **Transactional integrity** — atomic stock deduction, sale + income transaction,
  cart → multi-line order, all in single transactions with snapshotted prices.
- **Serverless-correct database access** — pooled (`DATABASE_URL`) and direct
  (`DIRECT_URL`) connections split for runtime vs migrations.
- **Server-side list handling** — search, sort and pagination run in the database
  (`where` / `orderBy` / `skip` / `take` + `count`) with indexes on frequently
  filtered date columns, so memory and payload stay constant as tables grow.
- **Performance-minded loading** — Recharts is lazy-loaded via `next/dynamic`
  (`ssr: false`), finance summaries are aggregated with `groupBy`, and the
  storefront's slug → tenant lookup is cached for an hour with `unstable_cache`
  (the product list is read live, so a price edit shows up immediately).
- **Self-healing demo data** — the showcase dataset is versioned in code and
  re-seeded automatically when the version changes, plus a nightly reset cron.
- **Graceful degradation** — Stripe, Resend and cron are env-gated; without keys
  the app still runs end to end.

---

## Architecture

```mermaid
flowchart LR
  B[Browser] -->|HTTP| P[Proxy · Auth.js<br/>session + tenantId + role]
  P --> RSC[Next.js App Router<br/>Server Components]
  RSC --> TX[withTenant / forTenant<br/>SET LOCAL app.tenant_id]
  RSC --> API[Route Handlers]
  API -->|RBAC + Zod| TX
  TX -->|RLS enforced| DB[(PostgreSQL · RLS)]
```

- **App Router (RSC)** — lists are read on the server through a tenant-scoped client.
- **Route Handlers** — all writes; `authorizeWrite` (RBAC) then Zod validation.
- **Auth.js (NextAuth v5)** — JWT session carrying role and `tenantId`; edge proxy
  guards routes.
- **PostgreSQL RLS** — the database-level guarantee.

📖 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — decisions and trade-offs ·
**[docs/API.md](docs/API.md)** — all endpoints with required roles and validation

---

## Security & RBAC

Authorization lives in `src/lib/authz.ts` and is enforced at three levels: the
edge proxy, sensitive pages (`requirePageView` / `requirePageWrite`), and every
write endpoint (`authorizeWrite`). Within the sections a role can see, reading is
open to any signed-in user and writing is role-restricted — a section that is not
in the role's navigation is blocked at the edge with a real `307` before anything
renders (`canViewPanelPath`), so an accountant cannot reach the livestock pages by
typing the URL.

| Role | Can write |
| --- | --- |
| **Admin** | Everything + staff management + audit log |
| **Worker** | Animals, milk, weight, fields/crops, inventory/feed, structures, breeding |
| **Vet** | Health & vaccinations, breeding, weight |
| **Accountant** | Finance, sales, customers, products/storefront, orders |

Hardening:

- **Tenant isolation in two layers** (see above) — the application layer runs
  everywhere including the demo; the database layer is verified in CI against a
  role that cannot bypass it.
- **Passwords hashed with scrypt** (async, so the event loop never blocks),
  constant-time comparison, and full backward compatibility with legacy bcrypt
  hashes. Plaintext is never stored or returned.
- **Security headers on every response** — CSP, HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Brute-force protection** — login is limited per IP *and* per IP+email (so one
  attacker cannot lock every account out from a shared address); sign-up,
  registration, invitation accept and public orders are limited per IP. Failed
  logins are written to the audit log as `LOGIN_FAILED`. Counters live in Postgres
  and are incremented with a single atomic upsert, so the limit holds across
  serverless instances (an in-memory counter would be divided among them).
  Verified by an integration test that fires ten concurrent requests against a
  limit of four. If the database is unreachable the limiter **fails open** onto an
  in-memory counter — rate limiting is defence in depth, and locking everyone out
  of the app during a database blip would do more damage than it prevents.
- **Safe image URLs** — animal images accept `http(s)` only; `javascript:` and
  `data:` are rejected.
- **Double validation** — the same Zod schemas run on the client and on every
  write endpoint.
- **Audit log** — every write that changes farm data, billing or account state
  records who did what and when: CRUD across all modules, plan changes (including
  the ones Stripe's webhook makes), public storefront orders, and farm deletion —
  which is written *after* the wipe and without a tenant, so the record survives
  the account it describes. The onboarding-tour flag is deliberately not audited:
  it is a UI preference, not farm data.
- **Protected cron** — fail-closed; without `CRON_SECRET` the endpoints return
  `503`, with it they require a bearer token.
- **Read-only demo account** — cannot write anything, so the live demo stays intact.

---

## Multi-tenancy

Çiftlik Pro started as a single-farm ERP and was migrated to a multi-tenant SaaS
where **every owner runs an isolated tenant**. Highlights:

- **Per-tenant unique constraints** — e.g. ear tags are `@@unique([tenantId, tagNumber])`.
- **Session-carried tenant** — `tenantId` lives in the JWT; every read and write
  runs in that context.
- **Sign-up & invitations** — public farm sign-up (`/kayit`) and tokenized staff
  invitations (`/davet/[token]`).
- **Plans** — FREE/PRO with enforced limits, env-gated Stripe subscription, usage
  dashboard.
- **Per-tenant storefront** — `/magaza/[slug]`; orders resolve the tenant from the
  slug and re-read products inside it, so a foreign product id is rejected.
- **Multi-tenant cron** — daily alerts are computed per tenant and sent to that
  tenant's admins.
- **GDPR/KVKK self-service** — JSON export and farm deletion.
- **Isolation tests** — against a real database with the non-superuser role.

---

## Tech stack

[Next.js 16](https://nextjs.org/) (App Router, RSC) · TypeScript ·
[PostgreSQL](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) ·
[Auth.js](https://authjs.dev/) · [Tailwind CSS](https://tailwindcss.com/) ·
[Zod](https://zod.dev/) · [Stripe](https://stripe.com/) (optional) ·
[next-intl](https://next-intl.dev/) · [Recharts](https://recharts.org/) ·
[Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) ·
[Docker](https://www.docker.com/) · Vercel

---

## Getting started

**Requirements:** Node.js 20.12+ (or 22 LTS, which CI uses — `npm run db:seed`
needs `--env-file-if-exists`) and Docker.

```bash
# 1. Install dependencies
npm install
#    npm 11.17+ blocks install scripts by default; if you see an "allow-scripts"
#    warning, the postinstall `prisma generate` was skipped — run it once:
#    npx prisma generate

# 2. Environment
cp .env.example .env
```

`.env` ships empty — fill it in before going further:

| Variable | Value |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Anything you like; Docker creates the database with them. e.g. `ciftlik` / `ciftlik` / `ciftlik_pro` |
| `DATABASE_URL` **and** `DIRECT_URL` | The same three values as a URL — **on port 5433**: `postgresql://ciftlik:ciftlik@localhost:5433/ciftlik_pro?schema=public` |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

> **Why 5433?** `docker-compose.yml` publishes the container's 5432 on host port
> **5433**, so it never collides with a PostgreSQL you already run locally.
> Everything else in `.env.example` is optional — see
> [Deploying to Vercel](#deploying-to-vercel).

```bash
# 3. Database
docker compose up -d db
npx prisma migrate dev

# 4. Sample data (optional)
npm run db:seed          # base accounts + a small dataset
npm run db:seed-demo     # the full showcase dataset + read-only demo account

# 5. Run
npm run dev              # http://localhost:3000
```

### Sample accounts (after `npm run db:seed`)

| Email | Password | Role |
| --- | --- | --- |
| `admin@ciftlik.com` | `sifre1234` | Admin |
| `ahmet@ciftlik.com` | `sifre1234` | Worker |
| `vet@ciftlik.com` | `sifre1234` | Vet |

### Demo accounts (after `npm run db:seed-demo`, and on the live demo)

Read-only showcase accounts — one per role, so the RBAC matrix is something you
can see rather than take on trust. The sign-in screen offers them as buttons;
each says up front what that role cannot reach, so a narrower menu reads as a
permission boundary and not as a broken page.

| Email | Password | Role | What it cannot reach |
| --- | --- | --- | --- |
| `demo@ciftlik.com` | `demo1234` | Admin | nothing — every module |
| `demo-worker@ciftlik.com` | `demo1234` | Worker | finance, sales, customers, products, orders, staff, audit |
| `demo-vet@ciftlik.com` | `demo1234` | Vet | everything except animals, tasks, map and calendar — 5 of 16 sections |
| `demo-muhasebe@ciftlik.com` | `demo1234` | Accountant | livestock, fields, inventory, feed, structures, staff, audit |

All four are read-only regardless of role: the guard is keyed on the email
address, so the Worker account cannot write even where the Worker role
normally could. Hidden sections are refused server-side too — a direct URL
returns a real HTTP redirect from the proxy, not a client-side bounce.

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:seed` | Seed base sample data |
| `npm run db:seed-demo` | Seed the showcase dataset (`-- --reset` to force) |

---

## Testing & quality

- **304 unit/component tests** (Vitest + Testing Library) covering validation
  schemas, RBAC, rate limiting, list query parsing, plan limits, finance/map/date/
  calendar helpers and UI primitives — **~90% line coverage on business logic** (the shared, database-backed paths are covered by integration tests instead).
- **Tenant isolation integration tests** (`*.int.test.ts`) against a real
  PostgreSQL instance as the non-superuser `ciftlik_app` role — cross-tenant
  reads, the fail-closed empty context, `Invitation` under RLS, and the shared
  rate-limit counter under ten concurrent requests. They are env-gated
  (`RUN_DB_TESTS=1`) so `npm test` stays database-free, and **CI turns them on**.
- **30 Playwright e2e tests** — authentication, animal CRUD, RBAC denial (real
  307 at the edge), sale → automatic income transaction, storefront cart → order,
  invitation → accept → role, and demo read-only enforcement.
- **CI (GitHub Actions)** — three parallel jobs on every push and PR: `build`
  (tsc + ESLint + Vitest + production build), `integration` (PostgreSQL +
  `ciftlik_app` role + the isolation tests) and `e2e` (real PostgreSQL service +
  seed + Playwright).
- **Pre-commit** — husky + lint-staged run `eslint --fix` on staged files.
- **Lighthouse** (production build, mobile emulation): sign-in **88** / storefront
  **92** performance, **95-96** accessibility, **100** best practices, **100** SEO,
  **CLS 0** on both. Details and caveats in [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md).

---

## Project structure

```
prisma/            Schema, migrations, seeds, RLS role script
docs/              Architecture, API reference, production RLS guide
e2e/               Playwright tests
src/
  app/             Pages and API routes (App Router)
    api/           REST endpoints
    panel/         Protected dashboard
    magaza/        Public per-tenant storefront
  components/      Reusable components
  lib/             Domain logic, auth, validation, tenant plumbing
messages/          tr.json / en.json translation catalogues
```

---

## Deploying to Vercel

1. **Database** — create PostgreSQL on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) and take two connection strings: the **pooled**
   one for `DATABASE_URL` and the **direct** one for `DIRECT_URL`.
2. **Import the repo** into Vercel (Next.js is detected automatically).
   `prisma generate` runs via `postinstall`. A **production** build then runs
   `prisma migrate deploy`, followed by the demo seed — which compares the
   dataset version in code against the one in the database and only reseeds when
   they differ — and finally `next build` (see `vercel.json`). Preview builds
   run `next build` alone.
3. **Environment variables:**

   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | Pooled connection (runtime) |
   | `DIRECT_URL` | Direct connection (migrations) |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | First admin bootstrap |

   **Optional, env-gated** — the related feature disables itself cleanly when
   absent: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (storefront payments),
   `STRIPE_PRO_PRICE_ID` (subscriptions), `RESEND_API_KEY` + `ALERT_EMAIL_FROM`
   (email alerts), `CRON_SECRET` (cron protection), `NEXT_PUBLIC_SITE_URL`.

4. **Turn on the RLS layer, if your host permits it** — create the non-superuser
   role and point the runtime connection at it:
   [docs/PRODUCTION-RLS.md](docs/PRODUCTION-RLS.md). On Neon's free tier this is
   currently not possible; [that document says why](docs/PRODUCTION-RLS.md#neon-limitation),
   so the next person does not spend an evening discovering it.

5. Push to `main` → Vercel builds and deploys.

---

## License

[MIT](LICENSE)
