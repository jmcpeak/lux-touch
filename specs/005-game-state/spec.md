# 005 - Game State

Snapshot shape, invariants, and phase machine (reinforce → attack → fortify).

## Snapshot Shape

```typescript
interface GameStateSnapshot {
  gameId: string;
  revision: number;
  phase: Phase;
  currentPlayerId: string;
  players: PlayerSnapshot[];
  territories: TerritorySnapshot[];
  cards: CardSnapshot[];
  seed: string;
}

type Phase = 'REINFORCE' | 'ATTACK' | 'FORTIFY';

interface PlayerSnapshot {
  id: string;
  name: string;
  isBot: boolean;
  isEliminated: boolean;
  color: string;
}

interface TerritorySnapshot {
  id: string;
  ownerId: string | null;
  armyCount: number;
}

interface CardSnapshot {
  id: string;
  ownerId: string;
  symbol: 'INFANTRY' | 'CAVALRY' | 'ARTILLERY' | 'WILD';
  territoryId?: string; // Optional; links to territory for trade bonus
}
```

## Derived Values

- **Reinforcement armies:** `max(3, floor(ownedTerritories / 3)) + continentBonuses + cardTradeBonus`
- **Continent bonus:** Sum of bonuses for continents fully owned by current player at turn start
- **Card trade values:** 4, 6, 8, 10, 12, 15, 20, ... (set index + 4, then +5 per set after 6th)

## Phase Machine

```
REINFORCE
  ├─ PLACE_ARMIES (all reinforcements placed) → ATTACK
  └─ TRADE_CARDS → (optional) PLACE_ARMIES → ATTACK

ATTACK
  ├─ ATTACK (combat) → ATTACK (continue) or ATTACK (capture → may get card)
  └─ END_TURN → FORTIFY

FORTIFY
  ├─ FORTIFY (one move)
  └─ END_TURN → next player → REINFORCE (or game over)
```

## Invariants

1. **Army counts:** Every territory has `armyCount >= 1` if owned, or `0` if unowned (should not occur in normal play)
2. **Ownership:** Every territory has exactly one owner (or none during setup)
3. **Phase consistency:** `currentPlayerId` is the active player; only non-eliminated players can be current
4. **Card ownership:** Every card has an owner who is not eliminated
5. **Reinforcement budget:** Total placed in REINFORCE must not exceed computed reinforcement
6. **Revision monotonicity:** `revision` increases with each state transition

## Turn Start Logic

On advancing to a new player's turn:
1. Compute reinforcement (territories, continents, cards)
2. If 5+ cards, must trade before placing (or allow trade + place in same phase)
3. Set phase to `REINFORCE`

## References

- [001-action-contract](../001-action-contract/spec.md) — Actions that mutate state
- [004-combat-rules](../004-combat-rules/spec.md) — Combat resolution
- [006-map-format](../006-map-format/spec.md) — Territory/continent structure
