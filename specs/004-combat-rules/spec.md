# 004 - Combat Rules

Dice combat resolution, capture, and move-in rules. Seeded RNG for deterministic replay.

## Dice Rules

- **Attacker:** Rolls 1, 2, or 3 dice (must have `attackerDice + 1` armies in source territory)
- **Defender:** Rolls 1 or 2 dice (up to number of armies in defending territory)
- **Comparison:** Highest vs highest; if defender has 2 dice, second-highest vs second-highest
- **Ties:** Defender wins
- **Casualties:** For each comparison, loser removes 1 army

## Example

Attacker rolls [5, 3, 2], Defender rolls [4, 1]:
- 5 vs 4 → Defender loses 1
- 3 vs 1 → Attacker loses 1
- 2 unpaired → no effect

## Capture

When defender reaches 0 armies:
- Attacker **captures** the territory
- Attacker **must** move into the conquered territory: at least as many armies as dice used
- Attacker may move more (up to `sourceArmies - 1`)
- Source territory must retain at least 1 army

## Seeded RNG

- Each game has a `seed` (e.g., created at game start)
- Combat uses `seedrandom(seed + eventIndex)` or similar for reproducibility
- Dice rolls are stored in game state or event log for replay/audit
- Event index increments with each combat round

## Implementation Notes

```typescript
// Pseudocode
function resolveCombat(attackerDice: number[], defenderDice: number[]): CombatResult {
  const a = [...attackerDice].sort((a, b) => b - a);
  const d = [...defenderDice].sort((a, b) => b - a);
  let attackerLosses = 0, defenderLosses = 0;
  for (let i = 0; i < Math.min(a.length, d.length); i++) {
    if (a[i] > d[i]) defenderLosses++;
    else attackerLosses++; // tie goes to defender
  }
  return { attackerLosses, defenderLosses };
}
```

## References

- [001-action-contract](../001-action-contract/spec.md) — ATTACK payload
- [005-game-state](../005-game-state/spec.md) — State updates after combat
