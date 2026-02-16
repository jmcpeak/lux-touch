# 001 - Action Contract

Action types, validation rules, and client→server contract for game mutations.

## Action Types

| Action | Phase | Description |
|--------|-------|--------------|
| `PLACE_ARMIES` | `REINFORCE` | Place reinforcement armies on owned territories |
| `TRADE_CARDS` | `REINFORCE` | Trade a valid card set for bonus armies (optional, before placing) |
| `ATTACK` | `ATTACK` | Roll dice to attack an adjacent enemy territory |
| `FORTIFY` | `FORTIFY` | Move armies from one friendly territory to an adjacent friendly territory |
| `END_TURN` | `ATTACK` or `FORTIFY` | End current turn; advance to next player |

## Request Shape

All actions are sent as POST requests with JSON body:

```typescript
interface ActionRequest {
  gameId: string;
  action: ActionType;
  payload: ActionPayload;
}

type ActionType = 'PLACE_ARMIES' | 'TRADE_CARDS' | 'ATTACK' | 'FORTIFY' | 'END_TURN';
```

## Payload Schemas

### PLACE_ARMIES

```typescript
interface PlaceArmiesPayload {
  placements: Array<{ territoryId: string; count: number }>;
}
```

- Sum of `count` must equal available reinforcement armies
- Each `territoryId` must be owned by current player
- All `territoryId` values must exist on the map

### TRADE_CARDS

```typescript
interface TradeCardsPayload {
  cardIds: [string, string, string]; // Exactly 3 card IDs
}
```

- Must form valid set: 3-of-a-kind, 1-of-each symbol, or 2 + wild
- Player must own all three cards
- Mandatory if player has 5+ cards and has not yet traded this turn

### ATTACK

```typescript
interface AttackPayload {
  fromTerritoryId: string;
  toTerritoryId: string;
  attackerDice: 1 | 2 | 3;
}
```

- `fromTerritoryId` must be owned by current player with ≥ `attackerDice + 1` armies
- `toTerritoryId` must be adjacent and owned by an enemy
- `attackerDice` must be 1, 2, or 3

### FORTIFY

```typescript
interface FortifyPayload {
  fromTerritoryId: string;
  toTerritoryId: string;
  count: number;
}
```

- Both territories must be owned by current player and adjacent
- `count` must be ≥ 1 and < armies in `fromTerritoryId`

### END_TURN

```typescript
interface EndTurnPayload {
  // Empty or reserved for future use
}
```

- No payload required

## Validation Rules

### Phase Checks

| Action | Allowed Phases |
|--------|----------------|
| `PLACE_ARMIES` | `REINFORCE` only |
| `TRADE_CARDS` | `REINFORCE` only (before or instead of placing all armies) |
| `ATTACK` | `ATTACK` only |
| `FORTIFY` | `FORTIFY` only |
| `END_TURN` | `ATTACK` or `FORTIFY` |

### Turn Ownership

- Only the player whose turn it is may submit actions
- Bot players are handled server-side; clients never submit actions for bots

### Idempotency

- MVP: No `X-Idempotency-Key` support; duplicates are both applied (see [016-idempotency-no-support](../016-idempotency-no-support/spec.md))
- Future: Cached response for duplicate keys (see [012-transactions-and-revisions](../012-transactions-and-revisions/spec.md))

## Response Shape

```typescript
interface ActionResponse {
  success: boolean;
  gameState?: GameStateSnapshot;  // Updated state on success
  error?: string;                 // Validation or server error
}
```

## References

- [005-game-state](../005-game-state/spec.md) — GameStateSnapshot shape
- [004-combat-rules](../004-combat-rules/spec.md) — ATTACK resolution
- [012-transactions-and-revisions](../012-transactions-and-revisions/spec.md) — Idempotency
