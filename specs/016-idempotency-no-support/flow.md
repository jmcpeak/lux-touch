# 016 - Idempotency Flow (MVP: No Support)

## Current Flow (No Idempotency)

```
Client                          Server
  |                               |
  | POST /api/games/[id]/action   |
  | X-Idempotency-Key: uuid-123   |
  | (header ignored)              |
  |------------------------------>|
  |                               | resolveGameAccess()
  |                               | applyAction()
  |                               | runBotTurnsUntilHuman()
  |                               | updateGameState()
  |                               |
  | { success, state }            |
  |<------------------------------|
```

Every request is processed. No lookup, no cache.

## Future Flow (With Idempotency)

```
Client                          Server
  |                               |
  | POST + X-Idempotency-Key      |
  |------------------------------>|
  |                               | lookup(gameId, key)
  |                     +-------->| cache hit? → return cached
  |                     |         | cache miss:
  |                     |         |   applyAction()
  |                     |         |   store(gameId, key, response)
  |                     |         |   return response
  |<---------------------+--------|
```

Deferred to post-MVP.
