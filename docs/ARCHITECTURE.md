# Architecture & Design Decisions

This document explains **why** Çiftlik Pro is built the way it is. It is organised
around the decisions that were genuinely hard, the alternatives that were rejected,
and the trade-offs that came with each choice.

For the phased migration plan see [`SAAS-PLAN.md`](SAAS-PLAN.md) (Turkish); for the
production database role setup see [`PRODUCTION-RLS.md`](PRODUCTION-RLS.md) (Turkish).

---

## The shape of the system

```mermaid
flowchart LR
  B[Browser] -->|HTTP| P[Proxy · Auth.js<br/>session + tenantId + role]
  P --> RSC[Next.js App Router<br/>Server Components]
  P -.->|307 if role lacks section| P
  RSC --> TX[withTenant / forTenant<br/>SET LOCAL app.tenant_id]
  RSC --> API[Route Handlers]
  API -->|authorizeWrite + Zod| TX
  TX -->|RLS enforced| DB[(PostgreSQL · RLS)]
  CRON[Vercel Cron] -->|Bearer CRON_SECRET| API
  STRIPE[Stripe] -->|signed webhook| API
```

- **Reads** happen in Server Components through a tenant-scoped Prisma client.
- **Writes** all go through Route Handlers: RBAC first, Zod second, tenant
  transaction third.
- **The database is the last line of defence**, not the first.

---

## Decision 1 — Row-level multi-tenancy, enforced twice

### The problem

The single biggest risk in a multi-tenant SaaS is a cross-tenant data leak. One
forgotten `where: { tenantId }` in one query is a breach. Code review does not
scale as a defence: there are ~47 write endpoints and dozens of read paths, and
every new feature is another chance to forget.

### Options considered

| Option | Why not |
| --- | --- |
| **Database per tenant** | Operationally heavy for a project this size: migrations must fan out across N databases, connection pools multiply, and serverless connection limits become the bottleneck almost immediately. |
| **Schema per tenant** | Same migration fan-out problem, plus Prisma has no first-class multi-schema story for this pattern. |
| **Row-level (`tenantId` column), app-layer filtering only** | One missed filter equals a breach, and nothing structurally prevents it. |
| **Row-level + PostgreSQL RLS** ✅ | Shared schema (simple migrations, one pool) with a guarantee that does not depend on remembering. |

### What was built

Two **independent** layers:

1. **PostgreSQL Row-Level Security.** Every tenant-scoped table has
   `ENABLE` + `FORCE ROW LEVEL SECURITY` and a `tenant_isolation` policy:
   `tenantId = current_setting('app.tenant_id')`, with `WITH CHECK` on writes so a
   row cannot be written into the wrong tenant either. If a query forgets its
   filter, the database returns nothing rather than someone else's data.

2. **A Prisma Client Extension** (`forTenant`, [`src/lib/tenant-prisma.ts`](../src/lib/tenant-prisma.ts))
   that injects `tenantId` into the `where` of every list/count/aggregate/
   `updateMany`/`deleteMany` operation. This layer exists for **ergonomics**, not
   safety — it means day-to-day code reads naturally.

`FORCE` matters: without it, the table owner bypasses its own policies. And the
application connects as a dedicated `NOSUPERUSER NOBYPASSRLS` role
(`prisma/rls-app-role.sql`), because a superuser ignores RLS entirely — which
would silently reduce the whole design to layer 2 only.

### Why `create` is not auto-injected

The extension deliberately does **not** inject `tenantId` on `create`. Callers pass
it explicitly, the type system requires it (`tenantId` is `NOT NULL` on 19 tables),
and RLS `WITH CHECK` rejects a wrong value. One explicit mechanism beats two
partially-overlapping implicit ones.

### The known gap, and why it is covered

Unique-targeted operations (`findUnique`, `update`, `delete`, `upsert`) address a
single row by primary key — there is no `where` to extend. The application layer
**cannot** protect these. This is exactly why RLS is not optional: at the database
level those operations return zero rows outside the tenant context. The isolation
tests assert precisely this, including `findUnique` by a known foreign id.

### Verification

[`src/lib/tenant-rls.int.test.ts`](../src/lib/tenant-rls.int.test.ts) runs against a
real PostgreSQL instance **as the non-superuser role** and asserts:

- tenant A cannot see tenant B's rows via `findMany` **or** `findUnique`;
- with no `app.tenant_id` set, **zero** rows are visible — the system fails closed.

---

## Decision 2 — `SET LOCAL` inside an interactive transaction

### The problem

RLS reads the tenant from `current_setting('app.tenant_id')`. The obvious way to
set it is a session-level `SET`. That is wrong for this deployment.

In serverless (Vercel + Neon/Supabase) the application talks to a **connection
pooler** (pgbouncer in transaction mode). Connections are handed out per
transaction and reused across tenants. A session-level variable would leak from one
request to the next — the exact bug the whole design exists to prevent, but worse,
because it would be intermittent.

### What was built

`withTenant` opens an **interactive transaction** and sets the variable
transaction-locally:

```ts
forTenant(tenantId).$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  //                   set_config(..., is_local = true) === SET LOCAL
  return fn(tx);
});
```

`SET LOCAL` is scoped to the transaction, so the pooler can safely hand the
connection to another tenant afterwards. The trade-off is that **every** tenant
operation is a transaction — slightly more overhead per request in exchange for an
isolation guarantee that survives connection reuse.

The pooled/direct split (`DATABASE_URL` / `DIRECT_URL`) follows from the same
reality: migrations need a direct connection because poolers in transaction mode
cannot run DDL sessions.

---

## Decision 3 — Login has to bypass RLS, deliberately

### The problem

Authentication is the one moment when the tenant is **unknown**: the user types an
email, and only after that lookup do we learn which tenant they belong to. But
`User` is a tenant-scoped table with `FORCE` RLS. As the non-superuser application
role and with no `app.tenant_id` set, `prisma.user.findUnique({ where: { email } })`
correctly returns **zero rows** — so nobody could ever log in.

This is the system working as designed, colliding with a genuine requirement.

### Options considered

| Option | Why not |
| --- | --- |
| Take `User` out of RLS | Throws away protection on the most sensitive table to solve a one-query problem. |
| Have the client send the tenant slug on login | Leaks tenant existence, adds friction, and is trivially enumerable. |
| Connect as superuser for login | Reintroduces the exact bypass the design forbids. |
| **A `SECURITY DEFINER` function** ✅ | Narrow, auditable, single-purpose escape hatch. |

### What was built

Migration `20260618167000_auth_lookup_function` defines `auth_user_by_email(text)`
as `SECURITY DEFINER`: it runs with the definer's privileges, so it can read across
tenants — but it does exactly one thing, takes one argument, and returns one row
(email is globally unique). Everything else stays under RLS.

```ts
const rows = await prisma.$queryRaw`SELECT * FROM auth_user_by_email(${email})`;
```

The trade-off is explicit: one audited, single-purpose bypass instead of weakening
the policy for every query touching `User`.

---

## Decision 4 — Authorization in one place, checked in three

`src/lib/authz.ts` holds the entire permission matrix. It is applied at three
levels, each catching what the previous one cannot:

| Level | Mechanism | Catches |
| --- | --- | --- |
| **Edge (proxy)** | `authorized()` in `auth.config.ts` | Unauthenticated access and role-forbidden `/panel` sections — returns a real `307` before any rendering. |
| **Page (RSC)** | `requirePageView` / `requirePageWrite` | Direct navigation to a sensitive page or form. |
| **API** | `authorizeWrite(module)` | Every write, including anything a client could call directly. |

Reads are open to any signed-in user; writes are role-restricted. The demo account
is blocked from **all** writes by email, independent of its role — which is why it
can safely be an ADMIN and still show off the billing and staff screens.

---

## Decision 5 — Correctness under concurrency

Two flows can corrupt data if written naively.

**Feed consumption** (`/api/feed`) must never drive stock negative. Read-then-write
has a TOCTOU window: two concurrent requests both read `quantity = 10`, both accept
a deduction of 8. The fix is to make the check part of the write:

```ts
const updated = await db.inventoryItem.updateMany({
  where: { id, quantity: { gte: requested } },   // the guard IS the query
  data:  { quantity: { decrement: requested } },
});
if (updated.count === 0) throw new InsufficientStockError();
```

**Sales and orders** must be all-or-nothing. A sale writes both the sale row and its
linked `INCOME` transaction inside a single transaction, so the books can never
disagree with the sales list. A storefront order writes the order and its lines
together, snapshotting product name and unit price per line — a later price change
must not rewrite history.

---

## Decision 6 — Optional integrations degrade, never break

Stripe, Resend and the cron endpoints are **env-gated**. Without keys the app runs
completely: the storefront falls back to pay-on-delivery, email alerts are skipped,
and the cron endpoints return `503` rather than running unprotected. This keeps a
one-command local setup honest — a reviewer clones the repo and everything works
without signing up for anything.

The same principle drives the demo dataset: it is versioned in
[`src/lib/demo-data.ts`](../src/lib/demo-data.ts) and re-seeded automatically when
the version changes, so the live demo repairs itself instead of depending on someone
remembering to run a script.

---

## Known limitations

Stated plainly, because pretending they do not exist is worse than having them.

| Limitation | Impact | Path forward |
| --- | --- | --- |
| **In-memory rate limiter** | On serverless, each instance keeps its own counters, so protection is divided across instances. Correct on a single instance; looser when scaled out. | The interface (`rateLimit`, `resetRateLimit`) is deliberately storage-agnostic — swapping the body for a shared store is a contained change. |
| **One tenant per user** | `User.tenantId` is a single value; a person cannot belong to two farms. | Introduce a `Membership` join table; the session already carries `tenantId`, so the change is mostly in auth and the tenant resolver. |
| **Tenant resolved from the session, not the URL** | No `acme.ciftlik-pro.app` subdomains yet. | `Tenant.slug` already exists and the storefront already resolves by slug; extending it to the panel is additive. |
| **Invitation tokens stored in plaintext** | Database read access exposes pending invite tokens. | Store a hash and compare on accept — tokens are already single-use and time-limited. |
