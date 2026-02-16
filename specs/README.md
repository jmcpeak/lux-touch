# Lux Touch Clone - Specification Index

Specifications for the Lux Touch web clone (Risk-style world conquest game).

## Foundations (000–099)

| ID | Spec | Description |
|----|------|--------------|
| [000](000-overview/spec.md) | Overview | Goals, non-goals, glossary, MVP ruleset summary |
| [001](001-action-contract/spec.md) | Action Contract | Action types, validation rules, client→server contract |
| [002](002-auth-integration/spec.md) | Auth Integration | Auth.js/NextAuth, optional auth, authorization rules |
| [003](003-bot-turns/spec.md) | Bot Turns | Bot behavior, difficulty levels, stepping model |
| [004](004-combat-rules/spec.md) | Combat Rules | Dice combat, capture, move-in, seeded RNG |
| [005](005-game-state/spec.md) | Game State | Snapshot shape, invariants, phase machine |
| [006](006-map-format/spec.md) | Map Format | 42-territory JSON format |
| [007](007-sse-streaming/spec.md) | SSE Streaming | SSE protocol, reconnect, last-event-id |

## Persistence & Server (010–019)

| ID | Spec | Description |
|----|------|--------------|
| [010](010-database-schema/spec.md) | Database Schema | Postgres tables, indexes, Prisma (Neon) |
| [011](011-api-endpoints/spec.md) | API Endpoints | Route handlers, request/response contracts |
| [012](012-transactions-and-revisions/spec.md) | Transactions & Revisions | Locking, revisions, idempotency |
| [013](013-bot-job-scheduler/spec.md) | Bot Job Scheduler | game_jobs processing, delays, Vercel cron (deferred) |
| [014](014-game-persistence-migration/spec.md) | Game Persistence Migration | In-memory → database, access control, repository |
| [015](015-inline-bot-execution/spec.md) | Inline Bot Execution | MVP: bots run inline, no game_jobs/cron |
| [016](016-idempotency-no-support/spec.md) | Idempotency: No Support | MVP: no X-Idempotency-Key, duplicates applied |
| [017](017-cron-no-support/spec.md) | Cron: No Support | MVP: no Vercel cron for bot jobs |

## Client Architecture (020–029)

| ID | Spec | Description |
|----|------|--------------|
| [020](020-client-state-zustand/spec.md) | Client State (Zustand) | Store slices, selectors, SSE integration |
| [021](021-map-rendering/spec.md) | Map Rendering | SVG structure, hit targets, labels, colors |

## Testing (030–039)

| ID | Spec | Description |
|----|------|--------------|
| [030](030-testing-strategy/spec.md) | Testing Strategy | Unit tests, integration, bot sims |

## Deployment & Ops (040–049)

| ID | Spec | Description |
|----|------|--------------|
| [040](040-deployment-vercel-neon/spec.md) | Deployment (Vercel + Neon) | Env vars, migrations, runtime notes |

---

## Tech Stack

- **Framework:** Next.js, React, TypeScript
- **State:** Zustand
- **Database:** Neon Postgres, Prisma ORM
- **Auth:** Auth.js (NextAuth)
- **Deploy:** Vercel
