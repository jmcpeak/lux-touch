# 003 - Bot Turns

Bot behavior, difficulty levels, stepping model, and async job processing.

## Overview

- Bots are computer-controlled players that act during their turn
- **MVP:** Bot turns run inline in the same request (see [015-inline-bot-execution](../015-inline-bot-execution/spec.md))
- **Future:** Async via `game_jobs` (see [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md))

## Difficulty Levels

| Level | Behavior | Delay (approx) |
|-------|----------|----------------|
| `EASY` | Random valid moves; suboptimal attacks | 0.5–1.5s |
| `MEDIUM` | Prefer continent control; basic strategy | 1–2s |
| `HARD` | Target weak players with cards; defensive play | 1.5–3s |

## Stepping Model

A bot turn is broken into discrete steps:

1. **REINFORCE:** Compute placements (continent bonuses, weak borders); submit `PLACE_ARMIES`
2. **TRADE_CARDS:** If 5+ cards, trade best set; submit `TRADE_CARDS` then `PLACE_ARMIES`
3. **ATTACK:** Loop: pick attack (or none), submit `ATTACK`, resolve combat; repeat until pass
4. **FORTIFY:** Pick best fortify move; submit `FORTIFY`
5. **END_TURN:** Submit `END_TURN`

Each step is a separate job or a single job that processes one action. Recommendation: one job per action for simpler retries and observability.

## Bot Decision Logic

### Reinforcement Placement

- Prioritize territories on borders with enemies
- Prioritize territories in incomplete continents (to secure bonus)
- Spread evenly if no clear priority

### Attack Selection

- **EASY:** Random valid attack
- **MEDIUM:** Prefer attacking into weak territories; avoid overextending
- **HARD:** Target players with many cards; avoid triggering eliminations that help others; hold chokepoints

### Fortify Selection

- Move from safe interior to threatened border
- **HARD:** Create strong fronts; avoid leaving single armies

## Job Flow

```
Bot turn starts
  → Create game_job (type: BOT_TURN, status: PENDING)
  → After delay, processor picks up job
  → Bot computes next action
  → Submit action via internal API (no HTTP)
  → If turn not over, create follow-up job (or re-queue self)
  → If turn over, mark job complete; next player (human or bot) proceeds
```

## References

- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — Job processing
- [001-action-contract](../001-action-contract/spec.md) — Action types
- [005-game-state](../005-game-state/spec.md) — State for bot decisions
