# 014 - Game Persistence Migration

Migration from in-memory game storage to database persistence using Prisma and Neon Postgres.

## Overview

**Current state:** Games are stored in an in-memory `Map` (`lib/game-store.ts`). Data is lost on server restart. No persistence across Vercel serverless invocations.

**Target state:** Games persisted in Postgres via Prisma. Full CRUD through database. Survives restarts and works across serverless instances.

## Goals

- Persist all game data to database on create and on every action
- Load game state from database instead of in-memory store
- Support both authenticated and anonymous games (per [002-auth-integration](../002-auth-integration/spec.md))
- Maintain backward compatibility with existing `GameStateSnapshot` shape and game engine
- Remove in-memory `gameStore` as the source of truth

## Non-Goals (This Spec)

- Idempotency keys (covered in [012](../012-transactions-and-revisions/spec.md))
- Row-level locking / transactions (can be added in a follow-up)
- SSE streaming (covered in [007](../007-sse-streaming/spec.md))
- Bot job scheduler / async bot turns (covered in [013](../013-bot-job-scheduler/spec.md))

## Prisma Schema Alignment

The existing schema ([010-database-schema](../010-database-schema/spec.md)) defines:

- `Game` — game metadata (userId, mapId, status, seed, accessToken)
- `GamePlayer` — players in the game (uuid, logicalId needed for engine)
- `GameState` — single row per game, `stateJson` holds full `GameStateSnapshot`

### Player ID Mapping

The game engine uses **logical IDs** (`"human"`, `"bot-0"`, `"bot-1"`, …) in `GameStateSnapshot`. The database uses **UUIDs** for `GamePlayer.id`.

**Solution:** Add `logicalId` column to `GamePlayer`:

| Column    | Type   | Notes                                      |
|-----------|--------|--------------------------------------------|
| logicalId | String | `"human"`, `"bot-0"`, `"bot-1"`, …; unique per game |

- `stateJson` continues to use logical IDs (no engine changes)
- `GameState.currentPlayerId` stores logical ID (string)
- When loading: use `stateJson` as-is; `GamePlayer` provides metadata if needed

### Schema Changes Required

```prisma
model GamePlayer {
  // ... existing fields ...
  logicalId   String   // "human" | "bot-0" | "bot-1" | ...
  @@unique([gameId, logicalId])
}
```

**Migration:** Add `logicalId` to `GamePlayer`; backfill not needed (new games only).

## Data Flow

### Create Game (POST /api/games)

```
1. Validate request (mapId, playerCount)
2. Get session (optional) → userId or null
3. Generate gameId (nanoid or uuid)
4. Generate seed (nanoid)
5. Generate accessToken (nanoid) for anonymous access
6. Build PlayerSnapshot[] with logical IDs (human, bot-0, …)
7. createInitialState(gameId, map, players, seed) → state
8. BEGIN transaction
   a. INSERT Game (id, userId, mapId, status, seed, accessToken)
   b. INSERT GamePlayer for each player (gameId, logicalId, name, isBot, color, orderIndex)
   c. INSERT GameState (gameId, revision, phase, currentPlayerId, stateJson)
   d. COMMIT
9. Return { gameId, accessToken, state, map }
```

### Fetch Game (GET /api/games/[id])

```
1. Resolve game access:
   - If X-Game-Token header: lookup Game by accessToken (plain or hashed)
   - If session: verify game.userId === session.userId
   - Else: 403
2. Load Game + GameState (include GameState)
3. Parse stateJson → GameStateSnapshot
4. Return { game: { id, status, mapId }, state, map }
```

### Submit Action (POST /api/games/[id]/action)

```
1. Resolve game access (same as GET)
2. Load Game + GameState
3. Parse stateJson → current state
4. getMap(game.mapId)
5. applyAction(state, map, action, payload)
6. If error: return 400
7. runBotTurnsUntilHuman(newState, map) → finalState
8. BEGIN transaction
   a. UPDATE GameState SET stateJson = finalState, revision = finalState.revision, phase, currentPlayerId
   b. If game over: UPDATE Game SET status = 'COMPLETED'
   c. COMMIT
9. Return { success: true, state: finalState }
```

## Access Control

### Anonymous Games

- `Game.userId` = null
- `Game.accessToken` = plain token (or bcrypt hash; MVP: plain for simplicity)
- Client sends `X-Game-Token: <accessToken>` on GET and POST action
- Server validates: `game.accessToken === header value`

### Authenticated Games

- `Game.userId` = session.userId
- `Game.accessToken` = null or optional (for share links later)
- Server validates: `game.userId === session.userId`

### Access Resolution Order

1. If `Authorization` / session present and `game.userId === session.userId` → allow
2. Else if `X-Game-Token` present and `game.accessToken === token` → allow
3. Else → 403 Forbidden

## API Route Changes

### POST /api/games

| Before                    | After                          |
|---------------------------|--------------------------------|
| gameStore.set(id, { state, mapId }) | prisma.game.create + gameState.create + gamePlayers.create |

- Use Prisma `Game.id` (uuid) as gameId — no custom id generation
- Store in DB; do not use gameStore

### GET /api/games/[id]

| Before           | After                          |
|------------------|--------------------------------|
| gameStore.get(id) | prisma.game.findUnique + include GameState |

- Require access: session or X-Game-Token
- Return 404 if not found, 403 if no access

### POST /api/games/[id]/action

| Before                    | After                          |
|---------------------------|--------------------------------|
| gameStore.get(id)         | prisma.game.findUnique + include GameState |
| gameStore.set(id, …)      | prisma.gameState.update        |

- Same access rules as GET

## Implementation Checklist

- [ ] Add `logicalId` to `GamePlayer` in Prisma schema
- [ ] Create Prisma migration
- [ ] Create `lib/game-repository.ts` (or similar) with:
  - [ ] `createGame(params)` → persists Game, GamePlayer[], GameState
  - [ ] `getGame(id, accessContext)` → loads Game + GameState, checks access
  - [ ] `updateGameState(gameId, state)` → updates GameState.stateJson
- [ ] Add `resolveGameAccess(gameId, request)` helper (session + X-Game-Token)
- [ ] Update POST /api/games to use repository instead of gameStore
- [ ] Update GET /api/games/[id] to use repository
- [ ] Update POST /api/games/[id]/action to use repository
- [ ] Remove or deprecate `lib/game-store.ts` (delete after migration)
- [ ] Add GET /api/games (list user's games) — requires auth
- [ ] Add DELETE /api/games/[id] — requires auth, must own

## Edge Cases

### accessToken Storage

- **Option A:** Store plain — simple, works for MVP. Token in DB must match header.
- **Option B:** Store hash — more secure. Use bcrypt or similar; compare on lookup.
- **Recommendation for MVP:** Plain. Upgrade to hash when adding security hardening.

### Game ID Format

- Current (in-memory): `nanoid(12)` (e.g. `"V1StGXR8_Z5j"`)
- Prisma `Game.id` is `uuid` (e.g. `"550e8400-e29b-41d4-a716-446655440000"`)
- **Decision:** Use Prisma uuid for `Game.id`. API returns this as `gameId`. Client and URLs use uuid. Longer but standard; no schema changes needed.

### Orphaned Games

- Anonymous games with no activity: consider TTL cleanup (future)
- Completed/abandoned games: keep for history (future)

## Files to Create/Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add logicalId to GamePlayer |
| `prisma/migrations/` | New migration |
| `src/lib/game-repository.ts` | **Create** — DB operations |
| `src/lib/game-access.ts` | **Create** — access resolution helper |
| `src/app/api/games/route.ts` | Use repository |
| `src/app/api/games/[id]/route.ts` | Use repository |
| `src/app/api/games/[id]/action/route.ts` | Use repository |
| `src/app/api/games/route.ts` (GET) | **Create** or add to existing — list games |
| `src/app/api/games/[id]/route.ts` (DELETE) | **Create** — delete game |
| `src/lib/game-store.ts` | **Delete** after migration |

## References

- [010-database-schema](../010-database-schema/spec.md) — Prisma schema
- [011-api-endpoints](../011-api-endpoints/spec.md) — API contracts
- [002-auth-integration](../002-auth-integration/spec.md) — Auth and access rules
- [005-game-state](../005-game-state/spec.md) — GameStateSnapshot shape
