# 016 - Idempotency: No X-Idempotency-Key Support (MVP)

MVP decision: do not implement idempotency keys. Duplicate requests are both applied.

## Overview

- **Decision:** No `X-Idempotency-Key` support for MVP
- **Behavior:** Every `POST /api/games/[id]/action` request is processed; duplicate requests apply the action multiple times
- **Future:** See [012-transactions-and-revisions](../012-transactions-and-revisions/spec.md) for full idempotency design

## Rationale

| No Support (MVP) | Full Support (Future) |
|------------------|------------------------|
| No storage (DB/Redis) | `idempotency_keys` table or Redis |
| No request deduplication | Cache response by (gameId, key) |
| Simpler deployment | TTL cleanup, cron |
| Client must avoid double-submit | Client can safely retry |
| **Acceptable for low traffic** | **Required for production resilience** |

**MVP choice:** Rely on client-side debouncing. Network retries may cause duplicate actions; acceptable for MVP.

## Behavior

### Request Handling

- `X-Idempotency-Key` header is **ignored** if present
- Each request is processed independently
- Same action sent twice → applied twice (revision increments twice)

### Example

```
Request 1: POST /api/games/abc/action
  Body: { action: "END_TURN", payload: {} }
  → 200 { success: true, state: { revision: 5 } }

Request 2: POST /api/games/abc/action (duplicate, e.g. retry)
  Body: { action: "END_TURN", payload: {} }
  Headers: X-Idempotency-Key: uuid-123
  → 200 { success: true, state: { revision: 6 } }  // Applied again
```

With full idempotency, Request 2 would return the cached response (revision 5) without re-applying.

## Implementation

- Action route does **not** read `X-Idempotency-Key` (header ignored)
- `src/lib/idempotency.ts` exports:
  - `IDEMPOTENCY_SUPPORTED = false`
  - `isIdempotencySupported(): false`
  - `getCachedResponse(gameId, key): Promise<null>` (stub for future)
- No idempotency storage or lookup

## Testing Strategy

- **Unit:** `isIdempotencySupported()` returns `false`
- **Unit:** `getCachedResponse()` (if exposed) returns `null` for any key
- **Integration (optional):** Two identical requests both succeed and both apply

## References

- [012-transactions-and-revisions](../012-transactions-and-revisions/spec.md) — Full idempotency design (deferred)
- [011-api-endpoints](../011-api-endpoints/spec.md) — Action endpoint
