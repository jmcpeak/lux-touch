# 010 - Database Schema

Postgres tables and indexes for Neon. Prisma schema.

## Overview

- **Database:** Neon Postgres (serverless)
- **ORM:** Prisma
- **Driver:** `@prisma/adapter-neon` for serverless/edge compatibility

## Tables

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| email | text | Unique, nullable for anonymous |
| name | text | Nullable |
| image | text | Nullable |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### games

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK users, nullable (anonymous) |
| mapId | text | e.g. "classic" |
| status | enum | ACTIVE, COMPLETED, ABANDONED |
| seed | text | For RNG reproducibility |
| accessToken | text | Hashed token for anonymous access |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### game_players

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| gameId | uuid | FK games |
| userId | uuid | FK users, nullable (bot) |
| name | text | Display name |
| isBot | boolean | |
| difficulty | enum | EASY, MEDIUM, HARD (bots only) |
| color | text | Hex color |
| orderIndex | int | Turn order |
| isEliminated | boolean | |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

Unique: (gameId, orderIndex)

### game_states

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| gameId | uuid | FK games |
| revision | int | Monotonically increasing |
| phase | enum | REINFORCE, ATTACK, FORTIFY |
| currentPlayerId | uuid | FK game_players |
| stateJson | jsonb | Full GameStateSnapshot |
| createdAt | timestamptz | |

One row per revision; latest revision = current state. Alternatively: single row per game with overwrite (simpler). Recommendation: single row, `revision` and `stateJson` updated in place.

### game_territories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| gameId | uuid | FK games |
| territoryId | text | From map definition |
| ownerId | uuid | FK game_players, nullable |
| armyCount | int | |
| updatedAt | timestamptz | |

Unique: (gameId, territoryId). Updated on each state change. Alternative: store in stateJson only; this table optional for querying.

### game_cards

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| gameId | uuid | FK games |
| ownerId | uuid | FK game_players |
| symbol | enum | INFANTRY, CAVALRY, ARTILLERY, WILD |
| territoryId | text | Nullable, for trade bonus |
| createdAt | timestamptz | |

### game_jobs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| gameId | uuid | FK games |
| type | enum | BOT_TURN |
| status | enum | PENDING, RUNNING, COMPLETED, FAILED |
| payload | jsonb | e.g. { playerId, step } |
| runAt | timestamptz | When to process |
| startedAt | timestamptz | Nullable |
| completedAt | timestamptz | Nullable |
| error | text | Nullable |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

## Simplified Schema (MVP)

For MVP, consider storing full state in `game_states.stateJson` and omitting `game_territories` / `game_cards` as separate tables. Reduces sync complexity.

**Minimal tables:** users, games, game_players, game_states, game_jobs

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| games | (userId, status) | List user's games |
| games | (accessToken) | Anonymous game lookup (hashed) |
| game_players | (gameId) | Load players for game |
| game_states | (gameId) | Latest state (if one row per game) |
| game_jobs | (status, runAt) | Job scheduler query |
| game_jobs | (gameId, status) | Game-specific jobs |

## Prisma Schema (Skeleton)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  games     Game[]
}

model Game {
  id          String   @id @default(uuid())
  userId      String?
  mapId       String
  status      GameStatus
  seed        String
  accessToken String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation(fields: [userId], references: [id])
  players     GamePlayer[]
  states      GameState[]
  jobs        GameJob[]
}

enum GameStatus { ACTIVE COMPLETED ABANDONED }
```

## References

- [011-api-endpoints](../011-api-endpoints/spec.md) — API uses these tables
- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — game_jobs
- [040-deployment-vercel-neon](../040-deployment-vercel-neon/spec.md) — Migrations
