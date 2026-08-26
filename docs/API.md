# API Reference

All write endpoints share the same three-stage pipeline:

```
authorizeWrite(module)   →   Zod schema.safeParse(body)   →   withTenant(tenantId, …)
   RBAC + demo guard            input validation              RLS-scoped transaction
```

`authorizeWrite` ([`src/lib/authz.ts`](../src/lib/authz.ts)) is the single source
of truth for role permissions. It returns `401` when there is no session, `403`
for the read-only demo account, and `403` when the role is not allowed for that
module. Every successful write is recorded in `AuditLog` — including the ones
that skip `authorizeWrite` because they have no session to check (public
storefront orders, the Stripe webhook) and farm deletion, whose record is written
without a tenant so it outlives the data it describes. The single exception is
`POST`/`DELETE /api/profile/onboarding`: a UI preference, not farm data.

**Reading is open to any signed-in user** — except panel sections a role cannot
see, which the edge proxy blocks with a real `307` before anything renders
(`canViewPanelPath`). Writing is restricted by role.
Sensitive *pages* are additionally gated with `requirePageView` / `requirePageWrite`.

## Role matrix

| Module | Roles allowed to write |
| --- | --- |
| `animals` | ADMIN, WORKER |
| `animalMedical` (health, vaccination) | ADMIN, VET |
| `breeding` | ADMIN, VET, WORKER |
| `milk` | ADMIN, WORKER |
| `weight` | ADMIN, WORKER, VET |
| `fields` (fields & crops) | ADMIN, WORKER |
| `inventory` (stock & feed) | ADMIN, WORKER |
| `structures` | ADMIN, WORKER |
| `transactions` | ADMIN, ACCOUNTANT |
| `sales` | ADMIN, ACCOUNTANT |
| `customers` | ADMIN, ACCOUNTANT |
| `products` | ADMIN, ACCOUNTANT |
| `orders` | ADMIN, ACCOUNTANT |
| `tasks` | ADMIN |
| `users` (staff & invitations) | ADMIN |

## Livestock

| Method | Path | Who | Validation | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/animals` | ADMIN, WORKER | `animalSchema` | Enforces the FREE plan limit (25 active animals). Ear tag uniqueness and mother validation run **inside the tenant**. |
| `DELETE` | `/api/animals` | ADMIN, WORKER | `{ ids: string[] }` | Bulk delete. |
| `PUT` `DELETE` | `/api/animals/[id]` | ADMIN, WORKER | `animalSchema` | |
| `POST` | `/api/animals/[id]/health` | ADMIN, VET | `healthRecordSchema` | |
| `POST` | `/api/animals/[id]/vaccinations` | ADMIN, VET | `vaccinationSchema` | `nextDate` feeds the calendar and the daily alert cron. |
| `POST` | `/api/animals/[id]/milk` | ADMIN, WORKER | `milkYieldSchema` | |
| `POST` | `/api/animals/[id]/weight` | ADMIN, WORKER, VET | `weightSchema` | |
| `DELETE` | `/api/weight/[id]` | ADMIN, WORKER, VET | — | |
| `POST` | `/api/animals/[id]/breeding` | ADMIN, VET, WORKER | `breedingSchema` | |
| `DELETE` | `/api/breeding/[id]` | ADMIN, VET, WORKER | — | |

## Fields, structures and stock

| Method | Path | Who | Validation | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/fields` | ADMIN, WORKER | `fieldSchema` | |
| `PUT` `DELETE` `PATCH` | `/api/fields/[id]` | ADMIN, WORKER | `fieldSchema` | `PATCH` updates map position only. |
| `POST` | `/api/fields/[id]/crops` | ADMIN, WORKER | `cropSchema` | |
| `PUT` `DELETE` | `/api/fields/[id]/crops/[cropId]` | ADMIN, WORKER | `cropSchema` | Cost/revenue/yield drive per-crop economics. |
| `POST` | `/api/structures` | ADMIN, WORKER | `structureSchema` | |
| `PUT` `DELETE` `PATCH` | `/api/structures/[id]` | ADMIN, WORKER | `structureSchema` | `PATCH` updates map position only. |
| `POST` | `/api/inventory` | ADMIN, WORKER | `inventorySchema` | |
| `DELETE` | `/api/inventory` | ADMIN, WORKER | `{ ids: string[] }` | Bulk delete. |
| `PUT` `DELETE` | `/api/inventory/[id]` | ADMIN, WORKER | `inventorySchema` | |
| `POST` | `/api/feed` | ADMIN, WORKER | `feedSchema` | **Atomic stock deduction.** A conditional `updateMany` (`quantity >= requested`) guards against TOCTOU; stock can never go negative under concurrent requests. |
| `DELETE` | `/api/feed/[id]` | ADMIN, WORKER | — | |

## Finance, sales and the storefront

| Method | Path | Who | Validation | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/transactions` | ADMIN, ACCOUNTANT | `transactionSchema` | |
| `PUT` `DELETE` | `/api/transactions/[id]` | ADMIN, ACCOUNTANT | `transactionSchema` | |
| `GET` | `/api/transactions/export` | ADMIN, ACCOUNTANT | — | CSV with a UTF-8 BOM (opens correctly in Excel). |
| `POST` | `/api/sales` | ADMIN, ACCOUNTANT | `saleSchema` | Creates the sale **and** its linked `INCOME` transaction in one transaction, so sales always reach the books. |
| `PUT` `DELETE` | `/api/sales/[id]` | ADMIN, ACCOUNTANT | `saleSchema` | |
| `POST` | `/api/customers` | ADMIN, ACCOUNTANT | `customerSchema` | |
| `PUT` `DELETE` | `/api/customers/[id]` | ADMIN, ACCOUNTANT | `customerSchema` | |
| `POST` | `/api/products` | ADMIN, ACCOUNTANT | `productSchema` | An active product publishes the farm to the public `/magaza` directory. |
| `PUT` `DELETE` | `/api/products/[id]` | ADMIN, ACCOUNTANT | `productSchema` | |
| `POST` | `/api/orders` | **public** | `orderSchema` | Rate limited (10 / 5 min per IP). Slug resolves the tenant; products are re-read **inside that tenant**, so a foreign product id is rejected. Name and unit price are snapshotted per line. |
| `PATCH` `DELETE` | `/api/orders/[id]` | ADMIN, ACCOUNTANT | `statusSchema` | Order status management. |

## Tasks

| Method | Path | Who | Validation |
| --- | --- | --- | --- |
| `POST` | `/api/tasks` | ADMIN | `taskSchema` |
| `PUT` `DELETE` | `/api/tasks/[id]` | ADMIN | `taskSchema` |

## Auth, tenants and staff

| Method | Path | Who | Validation | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | **public** | `signupSchema` | Creates tenant + owner ADMIN in one transaction. Rate limited (5 / 5 min per IP). Sets `app.tenant_id` before the user insert so it passes the RLS `WITH CHECK` policy as a non-superuser. |
| `*` | `/api/auth/[...nextauth]` | **public** | — | Auth.js handlers. Login is rate limited per IP+email (8) and per IP (30) in a 15-minute window; failures are audited as `LOGIN_FAILED`. |
| `POST` | `/api/auth/register` | ADMIN | `registerSchema` | Direct staff creation. Rate limited (10 / 5 min per IP). |
| `POST` | `/api/invitations` | ADMIN | `inviteSchema` | Returns a tokenized accept URL. Tokens are 32 random bytes, time limited, single use. |
| `DELETE` | `/api/invitations/[id]` | ADMIN | — | Revoke a pending invitation. |
| `POST` | `/api/invitations/[id]/accept` | **public** (token) | `acceptInviteSchema` | Enforces the plan seat limit. Reused or expired tokens return `410`. |
| `GET` | `/api/tenant/export` | ADMIN | — | Full tenant data export as JSON (GDPR/KVKK). |
| `DELETE` | `/api/tenant` | ADMIN | — | Deletes the farm and all of its data. |

## Profile

| Method | Path | Who | Validation |
| --- | --- | --- | --- |
| `PUT` | `/api/profile/password` | signed in (self) | `passwordChangeSchema` |
| `POST` `DELETE` | `/api/profile/onboarding` | signed in (self) | — |
| `GET` | `/api/notifications` | signed in | — |

## Billing

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/billing/checkout` | ADMIN | Opens a real Stripe subscription checkout when `STRIPE_PRO_PRICE_ID` is set; otherwise upgrades directly (demo mode). Blocked for the demo account. |
| `POST` | `/api/billing/downgrade` | ADMIN | Back to FREE. Blocked for the demo account. |
| `POST` | `/api/stripe/webhook` | **Stripe** | Signature verified with `STRIPE_WEBHOOK_SECRET`. `checkout.session.completed` marks an order paid or flips the tenant to PRO; `customer.subscription.deleted` returns it to FREE. Returns `503` when Stripe is not configured. |

## Cron

Both endpoints are **fail-closed**: without `CRON_SECRET` they return `503`, and
with it they require `Authorization: Bearer <CRON_SECRET>` (Vercel Cron adds this
header automatically).

| Method | Path | Schedule | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/cron/alerts` | `0 6 * * *` | Per-tenant digest of critical stock, overdue tasks and upcoming vaccinations, emailed to that tenant's admins. Tenants are processed in parallel. Skipped silently when `RESEND_API_KEY` is absent. |
| `GET` | `/api/cron/demo-reset` | `30 2 * * *` | Resets the showcase tenant to the current demo dataset. Never touches users, invitations or audit logs. |

## Status codes

| Code | Meaning |
| --- | --- |
| `400` | Zod validation failed (`details` carries per-field errors) or a domain rule was violated. |
| `401` | No session, or a bad cron token. |
| `403` | Role not permitted, demo account, or a plan limit was reached (`code: "PLAN_LIMIT"`). |
| `404` | Not found **within the caller's tenant** — cross-tenant ids look identical to missing ones. |
| `409` | Uniqueness conflict (e.g. ear tag already used in this tenant). |
| `410` | Invitation token expired or already used. |
| `429` | Rate limit exceeded (`Retry-After` header included). |
| `503` | An optional integration is not configured (Stripe, cron secret). |
