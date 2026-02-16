# 020 - Client State (Zustand)

Store slices, selectors, and SSE integration.

## Overview

- **State library:** Zustand
- **Structure:** Slices for game, UI, and connection state
- **SSE:** Store subscribes to stream and updates game slice on events

## Store Structure

```typescript
interface GameStore {
  // Game state
  gameId: string | null;
  state: GameStateSnapshot | null;
  map: MapDefinition | null;

  // Connection
  isConnected: boolean;
  lastEventId: string | null;

  // Actions
  createGame: (params: CreateGameParams) => Promise<void>;
  loadGame: (id: string, token?: string) => Promise<void>;
  submitAction: (action: ActionRequest) => Promise<void>;
  connectStream: (gameId: string, token?: string) => void;
  disconnectStream: () => void;
}
```

## Slices (Optional Split)

For larger apps, split into slices:

- `gameSlice`: gameId, state, map
- `connectionSlice`: isConnected, lastEventId, stream ref
- `uiSlice`: selectedTerritory, phase overlay, modal state

Use `zustand/slices` or manual composition.

## Selectors

```typescript
// Derived state
const currentPlayer = (state) => state.state?.players.find(p => p.id === state.state?.currentPlayerId);
const myTerritories = (state) => state.state?.territories.filter(t => t.ownerId === myPlayerId);
const canAttack = (state) => state.state?.phase === 'ATTACK' && !currentPlayer?.isBot;
```

## SSE Integration

1. `connectStream(gameId)` creates `EventSource` to `/api/games/[id]/stream`
2. On `state` event: `set({ state: JSON.parse(data), lastEventId: event.lastEventId })`
3. On `ping`: update `lastEventId` only (or ignore)
4. On disconnect: attempt reconnect with `Last-Event-ID` header
5. `disconnectStream()` closes EventSource, sets `isConnected: false`

## Action Flow

1. User triggers action (e.g., click Attack)
2. Store calls `submitAction({ gameId, action, payload })`
3. POST to `/api/games/[id]/action`
4. On success: either update from response `state` or rely on SSE to push new state
5. Recommendation: Optimistic update from response; SSE as backup for bot turns

## References

- [005-game-state](../005-game-state/spec.md) — GameStateSnapshot
- [007-sse-streaming](../007-sse-streaming/spec.md) — SSE protocol
- [021-map-rendering](../021-map-rendering/spec.md) — Map used by UI
