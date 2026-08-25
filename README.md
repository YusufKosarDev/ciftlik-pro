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
[![Tests](https://img.shields.io/badge/tests-277%20unit%20%2B%207%20e2e-success)](#testing--quality)
[![Multi-tenant](https://img.shields.io/badge/multi--tenant-Postgres%20RLS-4169E1)](#multi-tenancy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Live demo: [ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app)** &nbsp;·&nbsp;
click **"Demo olarak gez"** (Browse as demo) — or `demo@ciftlik.com` / `demo1234`

🇹🇷 **[Türkçe README](README.tr.md)**

</div>

---

## 🎬 Çiftlik Pro in 60 seconds

Sign in → dashboard → animal list (server-side search) → animal detail (milk and
weight charts) → 2D farm map → calendar → finance → dark mode → farm storefront:

![Çiftlik Pro demo tour](docs/demo.gif)

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
   If a query forgets its filter, the database returns nothing rather than someone
   else's data. In production the app connects as a dedicated
   `NOSUPERUSER NOBYPASSRLS` role, because a superuser ignores RLS entirely.

2. **A Prisma Client Extension** that injects `tenantId` into every list, count,
   aggregate and bulk-write `where`. This layer is for ergonomics; the database is
   the guarantee.

The tenant context is set with `SET LOCAL app.tenant_id` **inside an interactive
transaction** — a session-level `SET` would leak across requests behind a
connection pooler (pgbouncer), which is exactly the bug the design exists to
prevent.

This is verified, not asserted: integration tests run against a real PostgreSQL
instance **as the non-superuser role** and prove that tenant A cannot reach tenant
B's rows via `findMany` *or* `findUnique`, and that with no context set **zero**
rows are visible — the system fails closed.

> 📐 The full reasoning, the alternatives that were rejected, and the known
> limitations are in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Screenshots

**Dashboard** — sidebar layout, summary cards with real month-over-month deltas,
and a monthly income/expense chart:

![Dashboard](docs/screenshots/dashboard.png)

| 🌙 Dark mode | 🛒 Farm storefront (`/magaza/[slug]`) |
| ------------ | ------------------------------------- |
| ![Dark mode](docs/screenshots/dashboard-dark.png) | ![Storefront](docs/screenshots/store.png) |

| 💳 Billing — plan & usage limits | 👥 Staff — invitations & roles |
| -------------------------------- | ------------------------------ |
| ![Billing](docs/screenshots/billing.png) | ![Staff](docs/screenshots/staff.png) |

| Animals (server-side searchable table) | Animal detail (milk / weight charts) |
| -------------------------------------- | ------------------------------------ |
| ![Animals](docs/screenshots/animals.png) | ![Animal detail](docs/screenshots/animal-detail.png) |

| 2D farm map | Calendar (vaccinations / tasks / harvest / births) |
| ----------- | -------------------------------------------------- |
| ![Map](docs/screenshots/map.png) | ![Calendar](docs/screenshots/calendar.png) |

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
- **Fully bilingual** — Turkish/English across the whole app (next-intl):
  **all 459 translation keys** exist in both locales, including localized date
  and currency formatting.
- **Email alerts** — a daily cron emails each tenant's admins a digest of critical
  stock, overdue tasks and upcoming vaccinations (Resend).

---

## Engineering highlights

- **Two-layer tenant isolation** (Postgres RLS + Prisma extension), pgbouncer-safe
  `SET LOCAL`, non-superuser role in production — verified by integration tests.
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
  (`ssr: false`), finance summaries are aggregated with `groupBy`, storefronts are
  cached with `unstable_cache`.
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
write endpoint (`authorizeWrite`). Reading is open to any signed-in user; writing
is role-restricted.

| Role | Can write |
| --- | --- |
| **Admin** | Everything + staff management + audit log |
| **Worker** | Animals, milk, weight, fields/crops, inventory/feed, structures, breeding |
| **Vet** | Health & vaccinations, breeding, weight |
| **Accountant** | Finance, sales, customers, products/storefront, orders |

Hardening:

- **Tenant isolation in two layers** (see above), with a non-superuser database
  role in production.
- **Passwords hashed with scrypt** (async, so the event loop never blocks),
  constant-time comparison, and full backward compatibility with legacy bcrypt
  hashes. Plaintext is never stored or returned.
- **Security headers on every response** — CSP, HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Brute-force protection** — per-IP and per-IP+email rate limits on login and
  registration; failed logins are written to the audit log as `LOGIN_FAILED`.
  *Note: the limiter is in-memory, so on serverless it is divided across
  instances — see [known limitations](docs/ARCHITECTURE.md#known-limitations).*
- **Safe image URLs** — animal images accept `http(s)` only; `javascript:` and
  `data:` are rejected.
- **Double validation** — the same Zod schemas run on the client and on every
  write endpoint.
- **Audit log** — every write records who did what and when.
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

**Requirements:** Node.js 20+ and Docker.

```bash
# 1. Install dependencies
npm install
#    npm 11.17+ blocks install scripts by default; if you see an "allow-scripts"
#    warning, the postinstall `prisma generate` was skipped — run it once:
#    npx prisma generate

# 2. Environment
cp .env.example .env
#    Generate AUTH_SECRET:
#    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

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

- **277 unit/component tests** (Vitest + Testing Library) covering validation
  schemas, RBAC, rate limiting, list query parsing, plan limits, finance/map/date/
  calendar helpers and UI primitives — **~95% line coverage on business logic**.
- **Tenant isolation integration tests** against a real PostgreSQL instance using
  the non-superuser role (`*.int.test.ts`).
- **7 Playwright e2e tests** — authentication, animal CRUD, and RBAC denial.
- **CI (GitHub Actions)** — two parallel jobs on every push and PR: `build`
  (tsc + ESLint + Vitest + production build) and `e2e` (real PostgreSQL service +
  seed + Playwright).
- **Pre-commit** — husky + lint-staged run `eslint --fix` on staged files.

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
   `prisma generate` runs via `postinstall`, and production builds run
   `prisma migrate deploy` before `next build`.
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

4. **Enable RLS properly in production** — create the non-superuser role and point
   the runtime connection at it: see
   [docs/PRODUCTION-RLS.md](docs/PRODUCTION-RLS.md).

5. Push to `main` → Vercel builds and deploys.

---

## License

[MIT](LICENSE)
