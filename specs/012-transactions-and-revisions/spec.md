# 012 - Transactions and Revisions

Locking, revisions, and idempotency for game mutations.

## Revisions

- Each game state has a `revision` number
- Every successful action increments `revision`
- Clients send actions; server validates and applies atomically
- Optimistic concurrency: reject if client's expected revision does not match current

## Locking Strategy

- **Row-level lock:** `SELECT ... FOR UPDATE` on `games` row when processing an action
- **Scope:** Lock held for duration of action processing (validate → apply → persist)
- **Bot jobs:** Same lock; bot processor acquires lock before applying bot action

## Idempotency

- Client may send `X-Idempotency-Key: <uuid>` header with action requests
- Server stores `(gameId, idempotencyKey) → response` for a TTL (e.g., 24 hours)
- Duplicate request with same key: return cached response, do not re-apply action
- Implementation: `idempotency_keys` table or Redis

### Idempotency Key Table (Optional)

| Column | Type |
|-------|------|
| gameId | uuid |
| key | text |
| response | jsonb |
| createdAt | timestamptz |

Unique: (gameId, key). Cleanup: delete rows older than 24h (cron or on insert).

## Transaction Flow

```
1. Parse request, validate idempotency key
2. BEGIN transaction
3. SELECT game, game_state FOR UPDATE
4. Validate action (phase, turn, counts)
5. Apply action (reducer)
6. UPDATE game_state SET stateJson, revision
7. If bot turn next: INSERT game_job
8. COMMIT
9. If SSE: push state to stream
10. Return response
```

## Conflict Handling

- **Revision mismatch:** Return 409 Conflict with current state; client may retry
- **Lock timeout:** Return 503; client retries with backoff

## References

- [005-game-state](../005-game-state/spec.md) — Revision in state
- [011-api-endpoints](../011-api-endpoints/spec.md) — Action endpoint
- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — Bot job creation
