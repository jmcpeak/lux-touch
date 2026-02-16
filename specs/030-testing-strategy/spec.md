# 030 - Testing Strategy

Unit tests for reducer/validation, bot simulations.

## Scope

- **Unit tests:** Game logic (combat, reinforcement, phase transitions)
- **Integration tests:** API routes with test DB
- **Bot sims:** Run full games with bots to verify no crashes

## Unit Tests

### Combat Reducer

- Test `resolveCombat(attackerDice, defenderDice)` for all comparison cases
- Tie goes to defender
- Correct casualty counts

### Reinforcement Calculator

- `floor(territories/3)` with min 3
- Continent bonuses applied correctly
- Card trade values: 4, 6, 8, ...

### Phase Machine

- Valid transitions: REINFORCE → ATTACK → FORTIFY → next player
- Invalid action in wrong phase returns error

### Action Validation

- PLACE_ARMIES: sum matches available, territories owned
- ATTACK: adjacency, army count, phase
- FORTIFY: adjacency, ownership, count valid

## Integration Tests

- `POST /api/games` creates game with correct initial state
- `POST /api/games/[id]/action` applies action and returns updated state
- Idempotency: duplicate key returns same response

## Bot Simulations

- Run 10–100 full games (human replaced by random bot)
- Assert: no unhandled errors, game eventually ends (one winner or draw)
- Optional: measure average game length, distribution of winners by difficulty

## Test Stack

- **Runner:** Vitest or Jest
- **DB:** Neon branch for CI, or `pg-mem` / SQLite for fast unit tests
- **API:** `next/test` or `supertest` for route handlers

## File Layout

```
__tests__/
  unit/
    combat.test.ts
    reinforcement.test.ts
    phase.test.ts
    validation.test.ts
  integration/
    api/
      games.test.ts
      actions.test.ts
  bot/
    full-game-sim.test.ts
```

## References

- [004-combat-rules](../004-combat-rules/spec.md) — Combat logic
- [005-game-state](../005-game-state/spec.md) — State machine
- [001-action-contract](../001-action-contract/spec.md) — Validation rules
