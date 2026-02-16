# 011 - API Endpoints

Route handlers and request/response contracts.

## Base Path

All API routes under `/api/`.

## Endpoints

### POST /api/games

Create a new game.

**Request:**
```json
{
  "mapId": "classic",
  "playerCount": 4,
  "botDifficulties": ["EASY", "MEDIUM", "HARD"]
}
```

**Response:**
```json
{
  "gameId": "uuid",
  "accessToken": "short-lived-token",
  "state": { /* GameStateSnapshot */ }
}
```

- If authenticated: game associated with user
- If anonymous: `accessToken` required for subsequent requests

---

### GET /api/games/[id]

Fetch game state.

**Headers:** `X-Game-Token` (if anonymous)

**Response:**
```json
{
  "game": { "id", "status", "mapId", ... },
  "state": { /* GameStateSnapshot */ }
}
```

**Errors:** 404 if not found, 403 if no access

---

### GET /api/games

List games for authenticated user.

**Auth:** Required

**Query:** `?status=ACTIVE` (optional filter)

**Response:**
```json
{
  "games": [{ "id", "status", "mapId", "createdAt", ... }]
}
```

---

### POST /api/games/[id]/action

Submit a player action.

**Headers:** `X-Game-Token` (if anonymous). `X-Idempotency-Key` not supported (see [016](../016-idempotency-no-support/spec.md))

**Request:** See [001-action-contract](../001-action-contract/spec.md)

**Response:**
```json
{
  "success": true,
  "state": { /* GameStateSnapshot */ }
}
```

Or:
```json
{
  "success": false,
  "error": "Invalid phase"
}
```

---

### GET /api/games/[id]/stream

SSE stream for real-time updates. See [007-sse-streaming](../007-sse-streaming/spec.md).

---

### DELETE /api/games/[id]

Delete/abandon a game.

**Auth:** Required, must own game

**Response:** 204 No Content

---

## Error Format

```json
{
  "error": "Human-readable message",
  "code": "VALIDATION_ERROR"
}
```

Common codes: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`

## References

- [001-action-contract](../001-action-contract/spec.md) — Action payloads
- [002-auth-integration](../002-auth-integration/spec.md) — Auth rules
- [007-sse-streaming](../007-sse-streaming/spec.md) — Stream endpoint
- [012-transactions-and-revisions](../012-transactions-and-revisions/spec.md) — Idempotency
