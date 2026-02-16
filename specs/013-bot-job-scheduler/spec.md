# 013 - Bot Job Scheduler

game_jobs processing, delays, and Vercel integration.

## Overview

- Bot turns are processed asynchronously via `game_jobs`
- Jobs are created when a bot's turn starts
- A processor (cron, edge function, or background worker) picks up pending jobs after their `runAt` time

## Job Lifecycle

```
PENDING → RUNNING → COMPLETED
                 → FAILED
```

- **PENDING:** Created, waiting for `runAt`
- **RUNNING:** Processor has claimed it
- **COMPLETED:** Bot action applied successfully
- **FAILED:** Error; may retry or mark game broken

## Delay Model

- When creating a bot job, set `runAt = now() + delay`
- Delay varies by difficulty (see [003-bot-turns](../003-bot-turns/spec.md)): 0.5–3 seconds
- Simulates "thinking" and prevents instant bot turns

## Processor Options

### Option A: Vercel Cron

- `vercel.json` cron: `GET /api/cron/process-bot-jobs` every minute
- Handler: query `game_jobs WHERE status = PENDING AND runAt <= now()`, process each
- Limitation: 1 min granularity; use `runAt` to stagger within the minute

### Option B: Edge Function + Polling

- Client or a separate service polls an endpoint that processes one job
- Less ideal for serverless

### Option C: External Worker

- Long-running process (e.g., Railway, Render) polls DB and processes jobs
- More control, not pure Vercel

**Recommendation for MVP:** Option A (Vercel Cron). Cron runs every minute; jobs with `runAt` in the past are processed. For sub-minute delays, jobs may run slightly late (acceptable).

## Processing Logic

```
1. SELECT * FROM game_jobs WHERE status = 'PENDING' AND runAt <= now() LIMIT 10
2. For each job:
   a. UPDATE game_jobs SET status = 'RUNNING', startedAt = now()
   b. Load game state
   c. Compute bot action (see 003-bot-turns)
   d. Apply action (same path as human action)
   e. If turn not over: INSERT new game_job for next bot step
   f. UPDATE game_jobs SET status = 'COMPLETED', completedAt = now()
   g. On error: SET status = 'FAILED', error = message
3. Push state via SSE if clients connected
```

## Job Payload

```json
{
  "playerId": "uuid",
  "step": "REINFORCE" | "TRADE_CARDS" | "ATTACK" | "FORTIFY" | "END_TURN"
}
```

## Cron Configuration

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-bot-jobs",
    "schedule": "* * * * *"
  }]
}
```

- Protect with `CRON_SECRET` header; Vercel sends this for cron invocations

## References

- [003-bot-turns](../003-bot-turns/spec.md) — Bot behavior
- [010-database-schema](../010-database-schema/spec.md) — game_jobs table
- [040-deployment-vercel-neon](../040-deployment-vercel-neon/spec.md) — Cron setup
