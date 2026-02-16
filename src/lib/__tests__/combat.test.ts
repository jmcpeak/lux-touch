import { describe, expect, it } from 'vitest';
import { resolveCombat, rollDice } from '../combat';

describe('resolveCombat', () => {
  it('attacker wins when all dice higher', () => {
    const result = resolveCombat([6, 5, 4], [2, 1]);
    expect(result.attackerLosses).toBe(0);
    expect(result.defenderLosses).toBe(2);
  });

  it('defender wins when all dice higher', () => {
    const result = resolveCombat([1, 2], [4, 5]);
    expect(result.attackerLosses).toBe(2);
    expect(result.defenderLosses).toBe(0);
  });

  it('ties go to defender', () => {
    const result = resolveCombat([4, 3], [4, 3]);
    expect(result.attackerLosses).toBe(2);
    expect(result.defenderLosses).toBe(0);
  });

  it('one pair each: attacker wins one, defender wins one', () => {
    const result = resolveCombat([6, 2], [5, 3]);
    expect(result.attackerLosses).toBe(1);
    expect(result.defenderLosses).toBe(1);
  });

  it('sorts dice internally', () => {
    const result = resolveCombat([1, 6, 3], [5, 2]);
    expect(result.attackerDice).toEqual([6, 3, 1]);
    expect(result.defenderDice).toEqual([5, 2]);
  });

  it('handles single die each', () => {
    const result = resolveCombat([5], [3]);
    expect(result.attackerLosses).toBe(0);
    expect(result.defenderLosses).toBe(1);
  });

  it('handles 3 vs 2', () => {
    const result = resolveCombat([6, 5, 4], [3, 2]);
    expect(result.attackerLosses).toBe(0);
    expect(result.defenderLosses).toBe(2);
  });
});

describe('rollDice', () => {
  it('returns correct count', () => {
    const rng = () => 0.5;
    const dice = rollDice(3, rng);
    expect(dice).toHaveLength(3);
  });

  it('returns values 1-6', () => {
    const rng = () => 0.5;
    const dice = rollDice(100, rng);
    for (const d of dice) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });

  it('is deterministic with same rng', () => {
    const rng = () => 0.5;
    const a = rollDice(5, rng);
    const b = rollDice(5, rng);
    expect(a).toEqual(b);
  });
});
