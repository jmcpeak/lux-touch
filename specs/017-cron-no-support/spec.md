# 017 - Cron: No Vercel Cron for Bot Job Processing (MVP)

MVP decision: no Vercel cron. Bot turns run inline in the action request.

## Overview

- **Decision:** No Vercel cron for bot job processing
- **Behavior:** Bots run inline (see [015-inline-bot-execution](../015-inline-bot-execution/spec.md)); no `/api/cron/process-bot-jobs` endpoint
- **Future:** See [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) for cron-based bot processing

## Rationale

| No Cron (MVP) | Cron (Future) |
|---------------|---------------|
| No `vercel.json` crons | `crons` array in vercel.json |
| No cron route | `GET /api/cron/process-bot-jobs` |
| No `CRON_SECRET` verification | Protect route with `CRON_SECRET` |
| Bots run inline | Bots run via `game_jobs` + cron |
| Simpler deployment | Requires cron setup |
| **No scheduled jobs** | **Minute-granularity processing** |

**MVP choice:** Inline bot execution. Cron is not needed for MVP.

## Implementation

- `vercel.json` has **no** `crons` key
- No `/api/cron/process-bot-jobs` route
- `src/lib/cron-config.ts` exports `CRON_ENABLED = false` for explicit configuration
- `CRON_SECRET` in `.env.example` is optional (unused for MVP)

## Vercel Configuration

```json
// vercel.json (MVP)
{
  "headers": [...]
  // No "crons" key
}
```

## Testing Strategy

- **Unit:** `isCronEnabled()` returns `false`
- **Unit:** `getCronSchedule()` returns `null` (no schedule)

## References

- [015-inline-bot-execution](../015-inline-bot-execution/spec.md) — Inline bots
- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — Deferred cron design
- [040-deployment-vercel-neon](../040-deployment-vercel-neon/spec.md) — Deployment
