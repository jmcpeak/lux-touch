# 017 - Cron Flow (MVP: No Support)

## Current Flow (No Cron)

```
Human Action
     |
     v
POST /api/games/[id]/action
     |
     v
applyAction() + runBotTurnsUntilHuman()
     |
     v
Response (all bot turns completed inline)
```

No scheduled jobs. No cron invocations.

## Future Flow (With Cron)

```
Human Action
     |
     v
POST /api/games/[id]/action
     |
     v
applyAction() + INSERT game_job
     |
     v
Response (bot turn pending)

     ... time passes ...

Vercel Cron (* * * * *)
     |
     v
GET /api/cron/process-bot-jobs
     |
     v
SELECT game_jobs WHERE status=PENDING AND runAt<=now()
     |
     v
Process each job (apply bot action)
     |
     v
INSERT game_job for next step (if any)
```

Deferred to post-MVP.
