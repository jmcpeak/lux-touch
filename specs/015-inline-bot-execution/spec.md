# 015 - Inline Bot Execution

MVP approach: bots run inline in the same request as human actions. No `game_jobs`, no cron.

## Overview

- **Chosen approach:** Inline execution — after a human submits an action, any subsequent bot turns are processed synchronously in the same HTTP request before returning the response
- **Alternative (deferred):** Async jobs via `game_jobs` + cron (see [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md))

## Rationale

| Inline (MVP) | Async (game_jobs + cron) |
|--------------|--------------------------|
| No cron setup | Requires Vercel cron or external worker |
| No job table writes | Writes to `game_jobs` |
| Single request = full turn resolution | Multiple requests/jobs per turn |
| Simpler deployment | More observability, retries |
| Risk: long request if many bot turns | Risk: cold starts, latency |
| **Suitable for 2–4 players, few bots** | **Suitable for many bots, streaming UX** |

**MVP choice:** Inline. Acceptable for typical games (1 human + 2–3 bots). If a game has many consecutive bot turns, the request may take 1–3 seconds; acceptable for MVP.

## Execution Flow

```
POST /api/games/[id]/action
  1. Validate access, parse body
  2. applyAction(state, map, action, payload)  → newState
  3. runBotTurnsUntilHuman(newState, map)     → finalState
  4. updateGameState(id, finalState)
  5. return { success: true, state: finalState }
```

### runBotTurnsUntilHuman

```
while current player is a bot:
  runOneBotAction(state, map) → nextState or null
  if null: break
  state = nextState
return state
```

- **Max iterations:** 100 (safety limit)
- **Stop condition:** Current player is human, or `runOneBotAction` returns null

## Bot Action Logic (per phase)

### REINFORCE

- Compute `computeReinforcement(state, map, playerId)`
- Distribute armies evenly across owned territories (round-robin)
- Submit `PLACE_ARMIES` with computed placements

### ATTACK

- Find owned territories with ≥4 armies that border an enemy
- Pick first valid attack; submit `ATTACK`
- If no valid attack: submit `END_TURN`

### FORTIFY

- MVP: No fortify move; submit `END_TURN` immediately

### TRADE_CARDS

- MVP: Not implemented; bot skips (would need card set logic)

## Integration Points

| Location | Usage |
|----------|-------|
| `POST /api/games/[id]/action` | After `applyAction`, calls `runBotTurnsUntilHuman` |
| `src/lib/bot.ts` | `runBotTurnsUntilHuman`, `runOneBotAction` (internal) |

## Difficulty Levels (future)

Spec [003-bot-turns](../003-bot-turns/spec.md) defines EASY/MEDIUM/HARD. MVP uses a single strategy (effectively EASY). Difficulty can be added later by varying:

- Attack selection (random vs strategic)
- Reinforcement placement (spread vs border-heavy)
- Fortify moves

## Testing Strategy

- **Unit tests:** `runBotTurnsUntilHuman` with deterministic states
  - Bot in REINFORCE → places armies, advances to ATTACK
  - Bot in ATTACK with valid target → attacks
  - Bot in ATTACK with no target → END_TURN
  - Bot in FORTIFY → END_TURN
  - Human's turn → no bot actions, returns immediately
  - Multiple bots → runs until human's turn
- **Integration:** Action route returns final state after bot chain

## References

- [003-bot-turns](../003-bot-turns/spec.md) — Bot behavior, phases
- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — Deferred async approach
- [001-action-contract](../001-action-contract/spec.md) — Action types
