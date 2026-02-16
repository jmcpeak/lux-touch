# 007 - SSE Streaming

SSE protocol for game updates, reconnect behavior, and last-event-id.

## Overview

- **Purpose:** Push game state updates to clients in real time (e.g., after bot moves)
- **Protocol:** Server-Sent Events (SSE)
- **Endpoint:** `GET /api/games/[id]/stream`

## Event Types

| Event | Description | Data |
|-------|--------------|------|
| `state` | Full game state snapshot | `GameStateSnapshot` |
| `delta` | Partial update (future) | `{ path, value }` |
| `error` | Stream error | `{ message: string }` |
| `ping` | Keepalive | `{ timestamp: number }` |

## Request

```
GET /api/games/{gameId}/stream
Accept: text/event-stream
Last-Event-ID: <optional, for reconnect>
```

### Headers

- `Last-Event-ID`: When reconnecting, client sends last received event ID to resume from that point (server replays missed events if supported)

## Response

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event Format

```
event: state
id: rev-42
data: {"gameId":"...","revision":42,...}

event: ping
id: ping-1234567890
data: {"timestamp":1234567890}
```

## Reconnect Behavior

1. Client detects disconnect (connection closed, network error)
2. Client reconnects with `Last-Event-ID: rev-42` (last known revision)
3. Server checks if `revision` 42 is still current; if not, sends full state at latest revision
4. Client updates Zustand store and continues listening

## Ping Interval

- Server sends `ping` every 30 seconds to keep connection alive
- Client may close and reconnect if no event received for 60+ seconds

## Authorization

- Same rules as [002-auth-integration](../002-auth-integration/spec.md): user must have access to game (owner or anonymous token)

## References

- [020-client-state-zustand](../020-client-state-zustand/spec.md) — SSE integration with store
- [005-game-state](../005-game-state/spec.md) — GameStateSnapshot
