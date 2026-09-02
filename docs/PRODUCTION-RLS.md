# Row-Level Security in production — setting up the non-superuser role

Multi-tenant isolation is enforced in two layers:

1. **Application layer** — `withTenant(tenantId, …)` runs each request inside an
   interactive transaction and establishes the tenant context with
   `SET LOCAL app.tenant_id`; `forTenant` injects a `tenantId` filter into read
   queries.
2. **Database layer (the actual guarantee)** — Postgres RLS hides every row
   outside the context and rejects a write carrying the wrong `tenantId`, through
   a `tenant_isolation` policy on each tenant table (`USING` + `WITH CHECK`). With
   no context set, nothing is visible at all (**fail-closed**).

> ⚠️ **Critical:** in PostgreSQL a **superuser** — and, by default, a **table
> owner** — **bypasses RLS**. These tables have `FORCE ROW LEVEL SECURITY`
> enabled, so the owner is subject to the policy too; even so, the application
> must **never** connect as a superuser. If it does, RLS is not applied at all and
> tenants can read each other's data.

## 1. Run the migrations as the owner/superuser

Schema changes (DDL) are deliberately outside `ciftlik_app`'s rights. Run
`prisma migrate deploy` on the **owner** connection (normally Prisma's
`DIRECT_URL`). The application runtime connects as `ciftlik_app`.

> **This step comes first.** The script in the next step issues
> `GRANT ... ON ALL TABLES` and `GRANT EXECUTE` on three functions by name, and
> both apply to objects that **already exist**. If the schema is not there yet the
> role ends up without rights, or the script stops with "function does not exist".
> CI follows the same order (`.github/workflows/ci.yml`).

## 2. Create the non-superuser application role

`prisma/rls-app-role.sql` creates a role named `ciftlik_app` with `NOSUPERUSER` +
`NOBYPASSRLS` and grants it the necessary (non-DDL) privileges. It is idempotent
and safe to re-run.

Run it as a superuser or the database owner, connected to the application
database:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -v app_pw='A_STRONG_PASSWORD' \
  -f prisma/rls-app-role.sql
```

The script finishes by printing the `rolsuper`, `rolbypassrls`, `rolcreatedb` and
`rolcreaterole` columns — **all four must read `f`** — and emits a loud `WARNING`
if `rolbypassrls` is true.

> **The attribute step can fail, and that is expected.** Changing the `SUPERUSER`
> attribute in PostgreSQL — including turning it *off* — requires a real
> superuser. On Neon the most privileged reachable role is `neondb_owner`, whose
> `rolsuper` is already false. The script therefore attempts each attribute in its
> own fault-tolerant block and notes `[skipped] ...` when one does not apply. The
> newly created role already carries all of these attributes at the correct
> values, so the setup is still valid — the verification output at the end is what
> tells the truth.

> ⚠️ **Pass the same password when re-running.** `ALTER ROLE` rewrites the
> password unconditionally; a different value will fail authentication on every
> connection until `DATABASE_URL` is updated to match.

> ⚠️ **`ALTER DEFAULT PRIVILEGES` does not carry `FOR ROLE`.** The default
> privileges in the script apply only to objects created by **the role that runs
> the script**. Run this script and `prisma migrate deploy` **as the same role**
> (on Neon, `neondb_owner`); otherwise tables added by later migrations leave
> `ciftlik_app` without rights and the first access to them fails with
> `permission denied`. If you must use a different role, qualify the three
> `ALTER DEFAULT PRIVILEGES` statements with `FOR ROLE <owner>`.

## 3. Point the application's connection URLs at the new role

```bash
# Pooled (pgbouncer/pooler) — application queries
DATABASE_URL="postgresql://ciftlik_app:A_STRONG_PASSWORD@HOST:PORT/DB?schema=public&pgbouncer=true"

# Direct connection — migrations and DDL only (may stay on the owner role)
DIRECT_URL="postgresql://OWNER:OWNER_PW@HOST:PORT/DB?schema=public"
```

`withTenant` uses `set_config(..., true)` — transaction-local — so it is
compatible with pgbouncer's **transaction** mode.

## 4. Verify

Connect as the role directly and check the isolation:

```bash
# No context -> 0 rows (fail-closed)
PGPASSWORD=… psql -U ciftlik_app -d DB -h HOST -c 'SELECT count(*) FROM "Animal";'

# With context -> only that tenant's rows
PGPASSWORD=… psql -U ciftlik_app -d DB -h HOST \
  -c "BEGIN; SELECT set_config('app.tenant_id','<TENANT_ID>',true);
      SELECT count(*) FROM \"Animal\"; COMMIT;"
```

For automated proof, the integration tests (a real database is required):

```bash
RUN_DB_TESTS=1 \
APP_USER_DATABASE_URL="postgresql://ciftlik_app:…@HOST:PORT/DB?schema=public" \
npx vitest run src/lib/tenant-rls.int.test.ts
```

<a id="neon-limitation"></a>

## A known limitation on Neon

The steps above work on any PostgreSQL where role management is yours.
**They do not work on Neon's free tier**, and this is written down so that you do
not discover it in production. Two routes were attempted; both are closed.

### Door 1 — creating the role with SQL

`prisma/rls-app-role.sql` behaves exactly as expected: the role is created,
`rolsuper = f`, `rolbypassrls = f`, and the table, sequence and function grants go
through. Nothing is missing on the Postgres side — the password is stored with
`scram-sha-256`, `LOGIN` is enabled, and `CONNECT` is granted.

But the role **cannot connect**:

```
password authentication failed for user "ciftlik_app"
```

The cause is not Postgres but Neon's connection proxy in front of it: it
authenticates against its own control plane and does not know about a role created
through SQL. `neondb_owner` connects over the same host, with the same parameters
and the same driver — the only thing that changes is the username.

> `SET ROLE ciftlik_app` is not a way out either. Since PostgreSQL 16 the
> membership granted automatically to a role created by `CREATEROLE` carries only
> the `ADMIN` option. The `SET` option depends on the `createrole_self_grant` GUC,
> which is empty by default, so you get
> `permission denied to set role "ciftlik_app"`.

### Door 2 — creating the role from the Neon console

A role created in the console is recognised by the proxy and **can connect**. But
Neon automatically enrols it in the `neon_superuser` group, and the role inherits
that group's `BYPASSRLS` attribute. In other words, the role that can connect is
the role that bypasses RLS.

Removing the membership does not work either:

```
REVOKE neon_superuser FROM ciftlik_app;
→ ERROR: permission denied to revoke role
```

This is enforced in Neon's control plane; it is not something that can be worked
around from inside the database.

### Conclusion, and what it costs

On Neon's free tier an application role that is subject to RLS **cannot be
created**: the role that can connect bypasses it, and the role that does not
bypass it cannot connect.

To be precise about what is and is not lost:

| | Status |
| --- | --- |
| RLS policies | `ENABLE` + `FORCE` + `tenant_isolation` on 21 tables — **defined and correct** |
| CI verification | **6 RLS tests** run on every push as `ciftlik_app` (`NOSUPERUSER NOBYPASSRLS`) — `src/lib/tenant-rls.int.test.ts` |
| Hosted demo | Layer 2 is **dormant** — the connection uses a role carrying `BYPASSRLS` |
| Application layer | Prisma extension + `withTenant` + `SET LOCAL` — **active on the demo too** |

So on the demo, isolation comes down to a single layer. That is a limit of the
hosting, not of the design: on any PostgreSQL where role management is yours — a
paid Neon plan, Supabase, your own server — the steps above work as written and
the second layer comes up. The SQL and the tests are already there; the only thing
that changes is the connection string.

## Reads without a context: sign-in, invitation links and the storefront directory

Three reads have to happen **before** a tenant context exists, and all three are
solved with `SECURITY DEFINER` functions. Such a function runs with the
privileges of its **owner** and bypasses RLS for that one lookup only:

| Function | Migration | Why it has no context |
| --- | --- | --- |
| `auth_user_by_email(text)` | `20260618167000_auth_lookup_function` | Sign-in does not know the tenant until it has found the user by email, and `User` is under FORCE RLS, so a non-superuser role would see 0 rows querying it directly. |
| `invitation_by_token(text)` | `20260826120000_invitation_rls` | An invitation link is public (the user has not signed in yet), and `Invitation` is under FORCE RLS as well. The function **does not return the token itself**. |
| `public_storefront_tenants()` | `20260830120000_public_storefront_function` | The `/magaza` directory is cross-tenant by design and the visitor is not signed in; `Product` is under FORCE RLS, so a direct query would return 0 rows. The function touches `Product` only inside an `EXISTS` subquery (the select list is a constant `1`), so it **returns no product field at all** — only the `id`/`name`/`slug` of farms that have an active product. |

Each filters on a single equality (which does not help enumeration) and returns
only the minimum fields required.

> The **owner** of these functions must be a role that bypasses RLS (the
> owner/superuser that runs the migrations; on managed Postgres the project owner
> role usually bypasses). Running the migrations as that role is enough.

Sign-up (`/api/auth/signup`) and invitation acceptance
(`/api/invitations/[token]/accept`) establish the context with
`set_config('app.tenant_id', …)` in the same transaction before writing the new
user, so the `WITH CHECK` policy passes and both work under the non-superuser role
— the invitation's `acceptedAt` update happens inside that context too.

## Notes

- `tenantId` is **nullable** only on `AuditLog`: system records (e.g.
  `LOGIN_FAILED`) can exist without a tenant, so that table's policy allows a
  `NULL` in its `WITH CHECK` (`20260618163000_tenant_audit_policy`). On the other
  20 tenant tables it is `NOT NULL` — including `Order` and `OrderItem`
  (`20260618168000_order_rls_notnull`).
- When adding a new tenant table: put `ENABLE`/`FORCE ROW LEVEL SECURITY` and the
  `tenant_isolation` policy in the migration. Thanks to
  `ALTER DEFAULT PRIVILEGES`, `ciftlik_app` picks up DML rights on new tables
  automatically.
