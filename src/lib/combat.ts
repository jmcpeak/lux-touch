// Combat resolution (spec 004) - deterministic with seeded RNG

export interface CombatResult {
  attackerLosses: number;
  defenderLosses: number;
  attackerDice: number[];
  defenderDice: number[];
}

export function resolveCombat(
  attackerDice: number[],
  defenderDice: number[],
): CombatResult {
  const a = [...attackerDice].sort((x, y) => y - x);
  const d = [...defenderDice].sort((x, y) => y - x);
  let attackerLosses = 0;
  let defenderLosses = 0;
  for (let i = 0; i < Math.min(a.length, d.length); i++) {
    const ai = a[i];
    const di = d[i];
    if (ai != null && di != null && ai > di) defenderLosses++;
    else attackerLosses++; // tie goes to defender
  }
  return {
    attackerLosses,
    defenderLosses,
    attackerDice: a,
    defenderDice: d,
  };
}

export function rollDice(count: number, rng: () => number): number[] {
  const dice: number[] = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(rng() * 6) + 1);
  }
  return dice;
}
