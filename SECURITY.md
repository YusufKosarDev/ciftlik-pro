# Security Policy

## Reporting a vulnerability

Please report security issues **privately**, through GitHub's private vulnerability
reporting:

**[Report a vulnerability →](https://github.com/YusufKosarDev/ciftlik-pro/security/advisories/new)**

That channel is enabled on this repository, so the report stays between you and the
maintainer until a fix exists. Please do not open a public issue for anything that
could be exploited, and please do not test against the hosted demo — see below.

You can expect an acknowledgement within a few days. This is a portfolio project
maintained by one person, not a funded product, so there is no paid bounty and no
guaranteed response window beyond a good-faith effort.

## Supported versions

Only `main` is supported. There are no maintained release branches; fixes land on
`main` and reach the hosted demo on the next deploy.

## Scope

The interesting attack surface, and what the project already claims about it, is
documented rather than left implicit:

| Area | Where it is described |
| --- | --- |
| Tenant isolation (Postgres RLS + Prisma extension) | [README](README.md#multi-tenancy), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| The production database role, and the hosting limit on the demo | [docs/PRODUCTION-RLS.md](docs/PRODUCTION-RLS.md) |
| RBAC, rate limiting, audit logging, security headers | [README](README.md#security--rbac) |
| Open dependency advisories and why each is unreachable here | [README](README.md#the-advisories-npm-audit-reports) |

**Cross-tenant data access is the finding this project cares about most.** If you
find a way for one tenant to read or write another's rows, that is the report worth
sending, and it is worth sending even if you are not certain.

### Known and accepted

These are already documented; a report describing one of them is not a new finding:

- **Row-level security is dormant on the hosted demo.** Neon's free tier cannot
  produce a role that is both reachable through its connection proxy and outside
  `neon_superuser`, so the deployed instance runs on the application layer alone.
  The policies exist, are correct, and are exercised in CI on every push under a
  role that genuinely cannot bypass them. Both attempts and why each failed are in
  [docs/PRODUCTION-RLS.md](docs/PRODUCTION-RLS.md#neon-limitation).
- **The rate limiter fails open.** If the database is unreachable it falls back to
  an in-memory counter. Rate limiting is defence in depth here, and locking every
  user out during a database blip would do more damage than it prevents.
- **The showcase accounts are public**, and their shared password is in the README
  on purpose. They are read-only, enforced by email address rather than by role.
- **Open advisories in the dependency tree.** The current set, and why each is
  unreachable in this application, is in the README section linked above.

## Please do not

- Run automated scanners, fuzzers or load tests against
  `ciftlik-pro.vercel.app`. It is a free-tier demo with public read-only accounts;
  testing there degrades it for everyone else and tells you nothing you could not
  learn from a local instance. The README has the full local setup, and
  `docker compose up -d db` plus a seed gets you a real environment in a minute.
- Report findings that only apply to the deliberately public demo data.

## Out of scope

Missing hardening that is a deployment or hosting choice rather than a defect in
this code — email SPF/DKIM records, subdomain configuration, rate limits on
Vercel's edge, or anything requiring an already-compromised administrator account.
