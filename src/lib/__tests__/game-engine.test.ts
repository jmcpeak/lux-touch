import { describe, expect, it } from 'vitest';
import {
  applyAction,
  computeReinforcement,
  createInitialState,
  getCardTradeValue,
} from '../game-engine';
import type {
  GameStateSnapshot,
  MapDefinition,
  PlayerSnapshot,
  TerritorySnapshot,
} from '../types';

const MINI_MAP: MapDefinition = {
  id: 'mini',
  name: 'Mini',
  continents: [
    { id: 'c1', name: 'Continent 1', bonus: 2 },
    { id: 'c2', name: 'Continent 2', bonus: 3 },
  ],
  territories: [
    { id: 't1', name: 'T1', continentId: 'c1', adjacencies: ['t2'] },
    { id: 't2', name: 'T2', continentId: 'c1', adjacencies: ['t1', 't3'] },
    { id: 't3', name: 'T3', continentId: 'c2', adjacencies: ['t2'] },
  ],
};

const PLAYERS: PlayerSnapshot[] = [
  { id: 'human', name: 'Human', isBot: false, isEliminated: false, color: '#f00' },
  { id: 'bot-0', name: 'Bot', isBot: true, isEliminated: false, color: '#00f' },
];

/** Build a deterministic state for testing (human owns t1+t2, bot-0 owns t3) */
function buildTestState(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
  const territories: TerritorySnapshot[] = [
    { id: 't1', ownerId: 'human', armyCount: 2 },
    { id: 't2', ownerId: 'human', armyCount: 2 },
    { id: 't3', ownerId: 'bot-0', armyCount: 2 },
  ];
  return {
    gameId: 'g1',
    revision: 0,
    phase: 'REINFORCE',
    currentPlayerId: 'human',
    players: [...PLAYERS],
    territories,
    cards: [],
    seed: 'test-seed',
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('creates valid initial state', () => {
    const state = createInitialState('g1', MINI_MAP, PLAYERS, 'seed123');
    expect(state.gameId).toBe('g1');
    expect(state.seed).toBe('seed123');
    expect(state.phase).toBe('REINFORCE');
    expect(state.currentPlayerId).toBe('human');
    expect(state.revision).toBe(0);
    expect(state.players).toHaveLength(2);
    expect(state.territories).toHaveLength(3);
  });

  it('distributes territories evenly', () => {
    const state = createInitialState('g1', MINI_MAP, PLAYERS, 'fixed-seed');
    const owned = state.territories.filter((t) => t.ownerId === 'human');
    expect(owned.length).toBeGreaterThanOrEqual(1);
    expect(state.territories.every((t) => t.ownerId != null)).toBe(true);
    expect(state.territories.every((t) => t.armyCount >= 1)).toBe(true);
  });

  it('throws if no players', () => {
    expect(() =>
      createInitialState('g1', MINI_MAP, [], 'seed'),
    ).toThrow('createInitialState requires at least one player');
  });
});

describe('computeReinforcement', () => {
  it('returns at least 3 for small territory count', () => {
    const state = createInitialState('g1', MINI_MAP, PLAYERS, 'seed');
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    expect(armies).toBeGreaterThanOrEqual(3);
  });

  it('returns 0 for eliminated player', () => {
    const state = createInitialState('g1', MINI_MAP, PLAYERS, 'seed');
    const playersCopy = state.players.map((p) =>
      p.id === 'human' ? { ...p, isEliminated: true } : p,
    );
    const stateWithEliminated = { ...state, players: playersCopy };
    const armies = computeReinforcement(stateWithEliminated, MINI_MAP, 'human');
    expect(armies).toBe(0);
  });

  it('adds continent bonus when owning full continent', () => {
    const state = buildTestState();
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    expect(armies).toBe(5);
  });
});

describe('applyAction', () => {
  it('PLACE_ARMIES: rejects wrong phase', () => {
    const state = buildTestState({ phase: 'ATTACK' });
    const result = applyAction(state, MINI_MAP, 'PLACE_ARMIES', {
      placements: [{ territoryId: 't1', count: 3 }],
    });
    expect(result.error).toBe('Can only place armies in REINFORCE phase');
  });

  it('PLACE_ARMIES: rejects wrong total', () => {
    const state = buildTestState();
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    const result = applyAction(state, MINI_MAP, 'PLACE_ARMIES', {
      placements: [{ territoryId: 't1', count: armies - 1 }],
    });
    expect(result.error).toBe(`Must place exactly ${armies} armies`);
  });

  it('PLACE_ARMIES: rejects invalid territory', () => {
    const state = buildTestState();
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    const result = applyAction(state, MINI_MAP, 'PLACE_ARMIES', {
      placements: [{ territoryId: 't3', count: armies }],
    });
    expect(result.error).toBe('Invalid territory');
  });

  it('PLACE_ARMIES: advances to ATTACK phase', () => {
    const state = buildTestState();
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    const result = applyAction(state, MINI_MAP, 'PLACE_ARMIES', {
      placements: [{ territoryId: 't1', count: armies }],
    });
    expect(result.error).toBeUndefined();
    expect(result.state?.phase).toBe('ATTACK');
  });

  it('PLACE_ARMIES: increments revision', () => {
    const state = buildTestState();
    const armies = computeReinforcement(state, MINI_MAP, 'human');
    const result = applyAction(state, MINI_MAP, 'PLACE_ARMIES', {
      placements: [{ territoryId: 't1', count: armies }],
    });
    expect(result.state?.revision).toBe(1);
  });

  it('END_TURN: rejects in REINFORCE', () => {
    const state = buildTestState();
    const result = applyAction(state, MINI_MAP, 'END_TURN', {});
    expect(result.error).toBe('Cannot end turn now');
  });

  it('END_TURN: ATTACK -> FORTIFY', () => {
    const state = buildTestState({ phase: 'ATTACK' });
    const result = applyAction(state, MINI_MAP, 'END_TURN', {});
    expect(result.state?.phase).toBe('FORTIFY');
  });

  it('FORTIFY: rejects invalid fortify count', () => {
    const state = buildTestState({ phase: 'FORTIFY' });
    const result = applyAction(state, MINI_MAP, 'FORTIFY', {
      fromTerritoryId: 't1',
      toTerritoryId: 't2',
      count: 0,
    });
    expect(result.error).toBe('Invalid fortify count');
  });

  it('unknown action returns error', () => {
    const state = buildTestState();
    const result = applyAction(state, MINI_MAP, 'TRADE_CARDS' as any, {
      cardIds: ['a', 'b', 'c'],
    });
    expect(result.error).toBe('Unknown action');
  });
});

describe('getCardTradeValue', () => {
  it('returns correct values', () => {
    expect(getCardTradeValue(0)).toBe(4);
    expect(getCardTradeValue(1)).toBe(6);
  });
});
