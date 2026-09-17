# NexAccred API

Backend for NexAccred — NestJS + TypeScript, Prisma + PostgreSQL, clean/hexagonal
architecture, JWT auth with server-enforced RBAC. Companion to `nexaccred-react`
(the UI, now wired to this API for auth and readiness — see "Frontend
integration status" below) and the design docs in the repo root
(`01-PRD-NexAccred.md`, `02-ERD-NexAccred.mermaid`, `03-Data-Model-NexAccred.md`,
`05-RBAC-Separation-of-Duties.md`).

## Why this exists

The frontend prototype started in-memory only — see its README's "Known
limitations". This backend gives it a real database, real server-enforced
RBAC (closing the FR-11.5 gap that doc explicitly flags as "must not ship to
production"), and a real integration seam for the two external systems the
Operation module depends on:

- **AIHCM** (`08 - AIHCM`, a real, running sibling project — Java 21/Spring
  Boot 3) — Personnel & Competence, consumed live over its REST API.
- **Platform Audit** — Certification Activities, Audits, Technical Review,
  Certification Decisions. No live Platform Audit application exists yet, so
  this is served by a clearly-labeled stub adapter returning realistic sample
  data, swappable for a real HTTP adapter later without touching anything
  above the integration seam.

See `03-Data-Model-NexAccred.md` §1.4-1.5 for the full reasoning, including
why AIHCM's competency data and NexAccred's own `AuditorAuthorization`
(CAB-specific scope + expiry) are deliberately two different tables rather
than one.

## Architecture — clean/hexagonal, by layer

```
src/
├── domain/            framework-free — no NestJS, no Prisma types
│   ├── readiness/      the readiness engine, ported 1:1 from
│   │                    nexaccred-react/src/lib/readiness.js, with a full
│   │                    unit test suite (readiness-engine.spec.ts)
│   ├── ports/           interfaces only — PersonnelCompetencyPort,
│   │                    OperationsPort, *RepositoryPort. Everything else in
│   │                    the app depends on these, never on a concrete class.
│   └── errors/          ExternalIntegrationUnavailableError
│
├── application/        use-cases that wire domain + ports together —
│                        one folder per bounded context (schemes, personnel,
│                        operations, auth, admin, findings, capa, risk,
│                        tasks, documents, requirements, standards,
│                        compliance, accreditation-body)
│
├── infrastructure/     the only layer that knows concrete technology
│   ├── auth/            PasswordHasher (bcrypt)
│   ├── persistence/prisma/   Prisma schema + one repository per port
│   └── integrations/
│       ├── aihcm/              REAL HTTP adapter — JWT login, employee +
│       │                        competency endpoints, all against AIHCM's
│       │                        confirmed contract (see below)
│       └── platform-audit/     STUB adapter — sample data, clearly labeled
│
├── interface/           NestJS controllers — HTTP only, no business logic.
│                         Every route carries @Auth(EntityDomain, AccessLevel)
│                         or @Authenticated() (interface/auth/auth.decorator.ts)
└── modules/              NestJS DI wiring, one module per bounded context
```

**The rule this structure enforces:** a controller never imports Prisma, and
the readiness engine never imports NestJS. Dependencies point inward — `domain`
depends on nothing, `application` depends only on `domain`, `infrastructure`
and `interface` depend on both but never on each other directly. This is what
makes "swap Platform Audit's stub for a real adapter" a one-line change in
`infrastructure/integrations/integrations.module.ts` instead of a rewrite.

## Auth & RBAC

Real JWT auth (`POST /auth/login`), real server-side permission enforcement —
not the UI-only filtering the frontend README's "Known limitations" describes.
`interface/auth/permissions.guard.ts` checks the caller's JWT-embedded
permissions (issued at login from the `Role`/`RolePermission` tables) against
each route's declared `EntityDomain` + minimum `AccessLevel`, exactly per
`05-RBAC-Separation-of-Duties.md` §1's "entity domain × access level, never
hard-wired per screen." The 6 roles and their exact permission matrix (§2 of
that doc) are seeded verbatim by `prisma/seed.ts`.

Two enforcement details worth knowing about, both directly implementing
RBAC §5 requirements:

- **`RolePermission` self-escalation guard**
  (`application/admin/roles-admin.service.ts`) — a role can never grant
  another role a higher access level than it itself holds on that domain.
  Concretely: System Administrator holds `Approve` on Administration but
  `NoAccess` everywhere else, so it can grant permissions on Administration
  only — it structurally cannot make itself (or anyone) a super-admin. RBAC
  §3.1's "the System Administrator is not a super-admin" is enforced code,
  not just a sentence in a doc.
- **Approve-gated actions** — closing a Finding and editing users/roles
  require `AccessLevel.Approve`, not just `Edit`, matching the matrix's
  distinct tiers (e.g. Internal Auditor holds `Edit` on FindingsCAPA and can
  raise/progress findings, but only Head of Accreditation's `Approve` can
  close one).

Demo login (all seeded by `prisma/seed.ts`, password `NexAccred123!` for all six):

| Email | Role |
|---|---|
| `joan.marsh@nexaccred.io` | Head of Accreditation |
| `m.santos@nexaccred.io` | Internal Auditor |
| `k.devi@nexaccred.io` | Impartiality Committee |
| `rahayu.ningsih@nexaccred.io` | Accreditation Staff |
| `helda.mutiara@nexaccred.io` | Document Controller |
| `r.alvi@nexaccred.io` | System Administrator |

## Bounded contexts (13) and their RBAC domain

| Context | Routes | RBAC domain |
|---|---|---|
| Auth | `/auth/login` | — |
| Schemes / Readiness | `/schemes`, `/readiness/*` | Requirements |
| AccreditationBody | `/accreditation-bodies` | Requirements |
| Standards | `/standards` | Requirements |
| Requirements | `/requirements` | Requirements |
| Compliance | `/compliance-records` | Requirements |
| Operations (Platform Audit) | `/operations/*` | Requirements¹ |
| Personnel (AIHCM) | `/personnel/*` | Personnel |
| Findings | `/findings` (+ `/:id/close`, Approve) | FindingsCAPA |
| CAPA | `/capa` (+ `/:id/stage`, forward-only) | FindingsCAPA |
| Risk | `/risks` | FindingsCAPA |
| Tasks | `/tasks` (+ `/tasks/overdue`) | none — `@Authenticated()` only² |
| Documents | `/documents`, `/required-document-types` | Evidence |
| Admin | `/users`, `/roles` (+ permission grants, Approve) | Administration |
| Audit Trail | `/audit-trail` | Administration |
| Integration status | `/integrations/sync-status` | Administration |

¹ `05-RBAC-Separation-of-Duties.md`'s domain table doesn't explicitly name
Operation-module screens other than Personnel — Requirements was the closest
existing bucket (documented as a judgment call in the controller itself).
² Tasks appear in 5 of 6 roles' nav and trace back to requirements, findings,
CAPA, *and* risk — no single domain fits, so any authenticated user can
manage tasks (documented in the controller).

## Frontend integration status

`nexaccred-react`'s `Login.jsx` and `App.jsx` now perform real authentication
and fetch real readiness data (`GET /readiness/overall`,
`/readiness/upcoming-assessments`) instead of local mock computation — see
`src/api/`, `src/hooks/useFetch.js`, `src/components/DataState.jsx` in that
project. **Not yet wired**: the remaining screens (Requirements, Findings,
CAPA, Documents, Personnel, Operations, Admin, …) still read
`nexaccred-react/src/data/*.js`'s original local sample data — the backend
endpoints exist and are fully tested (see below), but the UI hasn't been
repointed at them yet. This is deliberate scope triage, not an oversight —
see the git history / session notes for why.

One concrete, real consequence of turning on server-enforced RBAC that's
worth knowing: the Impartiality Committee and System Administrator roles
both hold `NoAccess` on the Requirements domain, so the always-visible
readiness strip's fetch now correctly 403s for them and renders an error
state instead of a score — this is *more* correct than the old prototype
(which showed every role the same fake number), not a bug.

## Running this locally

### 1. Database

A dedicated local PostgreSQL cluster was provisioned specifically for this
project — **not** the shared instance AIHCM uses — to keep the two projects
fully isolated (different port, different data directory, different socket
path; AIHCM's own Postgres.app-based setup is documented in its
`docs/adr/0007-first-real-build-and-run.md`, and the same portable-binary
approach was reused here):

```bash
# One-time setup, if the cluster doesn't already exist:
PG_BIN="$HOME/dev-tools/Postgres.app/Contents/Versions/16/bin"
"$PG_BIN/initdb" -D "$HOME/dev-tools/nexaccred-pgdata" -U nexaccred --auth=trust --encoding=UTF8
mkdir -p "$HOME/dev-tools/nexaccred-pgsocket"

# Start it (needed every session — it is not a system service):
"$PG_BIN/pg_ctl" -D "$HOME/dev-tools/nexaccred-pgdata" \
  -l "$HOME/dev-tools/nexaccred-pg.log" \
  -o "-k $HOME/dev-tools/nexaccred-pgsocket -p 5433 -c listen_addresses=localhost" \
  start

# Stop it:
"$PG_BIN/pg_ctl" -D "$HOME/dev-tools/nexaccred-pgdata" stop
```

`DATABASE_URL` in `.env` already points at `127.0.0.1:5433/nexaccred` — no
password (trust auth, local-only, matching AIHCM's own dev posture).

### 2. Backend

```bash
cd nexaccred-api
npm install
cp .env.example .env        # edit if your AIHCM instance differs from the defaults
npx prisma migrate dev      # applies the schema (already run once during setup)
npx ts-node prisma/seed.ts  # roles/permissions/demo users, 3 ABs, 5 schemes, ExternalSystem rows
npm run start:dev           # http://localhost:3001
```

**Important gotcha**: if a rebuild ever silently produces an empty/stale
`dist/`, delete `tsconfig.tsbuildinfo` first — TypeScript's incremental-build
cache can make `tsc`/`nest build` skip emitting even after `dist/` was
deleted externally. `rm -f tsconfig.tsbuildinfo && npx nest build` is the
safe sequence; it's why every script above does that.

Verify:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joan.marsh@nexaccred.io","password":"NexAccred123!"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")

curl http://localhost:3001/health
curl http://localhost:3001/schemes -H "Authorization: Bearer $TOKEN"
curl http://localhost:3001/schemes/iso27001/readiness -H "Authorization: Bearer $TOKEN"   # exercises the blocking rule live
curl http://localhost:3001/operations/certification-activities -H "Authorization: Bearer $TOKEN"  # Platform Audit stub
curl http://localhost:3001/integrations/sync-status -H "Authorization: Bearer $TOKEN"
```

### 3. AIHCM (optional, for real Personnel & Competence data)

Without AIHCM running, `GET /personnel/:id` correctly degrades to a 503 with
a "which system, why" body (`ExternalIntegrationUnavailableFilter`) rather
than a raw crash — this was verified during setup. To get real data instead
of that 503:

```bash
cd "../08 - AIHCM/backend"
mvn spring-boot:run -Dspring-boot.run.profiles=dev-seed
```

Then `GET http://localhost:3001/personnel/<an AIHCM employeeId>` (from
AIHCM's dev-seed data — see its own README for the seeded personas) will
return a real profile + competency list.

## Testing

```bash
npm test          # domain/readiness/readiness-engine.spec.ts — 15 tests,
                   # pure functions, no DB required

npm run test:e2e  # test/*.e2e-spec.ts — 39 tests against the real running
                   # app + real dev database (same convention AIHCM documents
                   # in its ADR 0007 for local-Postgres integration tests):
                   #   auth-rbac.e2e-spec.ts    — login, token handling, the
                   #                              full RBAC matrix (403s with
                   #                              the right domain named)
                   #   crud-modules.e2e-spec.ts — every bounded context: RBAC
                   #                              per domain, create→appears
                   #                              in list (data consistency),
                   #                              the CAPA forward-only stage
                   #                              guard, the Finding Approve
                   #                              gate, the RolePermission
                   #                              self-escalation guard, and
                   #                              that every mutation lands
                   #                              in the audit trail
```

The frontend's own Playwright suite (`nexaccred-react/tests/roles.spec.js`,
32 tests) now also exercises this backend for real — login, session
persistence, logout, and the RBAC-driven error states described above — not
just UI navigation.

## What's deliberately not built yet

- **Frontend wiring for most screens** — see "Frontend integration status"
  above. The backend for these exists and is tested; the React screens still
  read local sample data.
- **A real Platform Audit adapter** — there is nothing to integrate with yet.
- **Row-level / scheme-level permission scoping** — RBAC §6 calls this out
  explicitly as a v2 extension ("Edit requirements, but only for schemes I
  own"); today's model is domain-level only, matching the matrix as
  documented.
- **Token revocation / short-lived sessions** — permissions are embedded in
  the JWT at login time (see `application/auth/jwt-claims.ts`'s file
  comment for the reasoning); a permission change via `PATCH
  /roles/:roleId/permissions/:entityDomain` takes effect for a user on their
  next login, not mid-session.
