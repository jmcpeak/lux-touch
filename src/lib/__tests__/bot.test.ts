import { describe, expect, it } from 'vitest';
import { runBotTurnsUntilHuman } from '../bot';
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

function buildState(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
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

describe('runBotTurnsUntilHuman', () => {
  it('returns state unchanged when human is current player', () => {
    const state = buildState({ currentPlayerId: 'human' });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result).toBe(state);
    expect(result.currentPlayerId).toBe('human');
    expect(result.phase).toBe('REINFORCE');
  });

  it('runs bot REINFORCE: places armies and advances', () => {
    const state = buildState({
      currentPlayerId: 'bot-0',
      phase: 'REINFORCE',
      territories: [
        { id: 't1', ownerId: 'human', armyCount: 2 },
        { id: 't2', ownerId: 'human', armyCount: 2 },
        { id: 't3', ownerId: 'bot-0', armyCount: 2 },
      ],
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.revision).toBeGreaterThan(state.revision);
    expect(['bot-0', 'human']).toContain(result.currentPlayerId);
    expect(['ATTACK', 'REINFORCE']).toContain(result.phase);
  });

  it('runs bot ATTACK when valid target exists', () => {
    const state = buildState({
      currentPlayerId: 'bot-0',
      phase: 'ATTACK',
      territories: [
        { id: 't1', ownerId: 'human', armyCount: 2 },
        { id: 't2', ownerId: 'human', armyCount: 2 },
        { id: 't3', ownerId: 'bot-0', armyCount: 5 },
      ],
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.revision).toBeGreaterThan(state.revision);
    const t2 = result.territories.find((t) => t.id === 't2');
    const t3 = result.territories.find((t) => t.id === 't3');
    expect(t2).toBeDefined();
    expect(t3).toBeDefined();
  });

  it('runs bot ATTACK with no valid target: END_TURN advances to human', () => {
    const state = buildState({
      currentPlayerId: 'bot-0',
      phase: 'ATTACK',
      territories: [
        { id: 't1', ownerId: 'bot-0', armyCount: 2 },
        { id: 't2', ownerId: 'bot-0', armyCount: 2 },
        { id: 't3', ownerId: 'human', armyCount: 2 },
      ],
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.currentPlayerId).toBe('human');
    expect(result.phase).toBe('REINFORCE');
  });

  it('runs bot FORTIFY: END_TURN advances to human', () => {
    const state = buildState({
      currentPlayerId: 'bot-0',
      phase: 'FORTIFY',
      territories: [
        { id: 't1', ownerId: 'human', armyCount: 2 },
        { id: 't2', ownerId: 'human', armyCount: 2 },
        { id: 't3', ownerId: 'bot-0', armyCount: 2 },
      ],
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.currentPlayerId).toBe('human');
    expect(result.phase).toBe('REINFORCE');
  });

  it('runs multiple bot turns until human', () => {
    const players: PlayerSnapshot[] = [
      ...PLAYERS,
      { id: 'bot-1', name: 'Bot 1', isBot: true, isEliminated: false, color: '#0f0' },
    ];
    const territories: TerritorySnapshot[] = [
      { id: 't1', ownerId: 'human', armyCount: 2 },
      { id: 't2', ownerId: 'bot-0', armyCount: 2 },
      { id: 't3', ownerId: 'bot-1', armyCount: 2 },
    ];
    const state = buildState({
      players,
      territories,
      currentPlayerId: 'bot-0',
      phase: 'REINFORCE',
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.currentPlayerId).toBe('human');
  });

  it('stops when bot has no territories (eliminated)', () => {
    const state = buildState({
      currentPlayerId: 'bot-0',
      phase: 'REINFORCE',
      territories: [
        { id: 't1', ownerId: 'human', armyCount: 2 },
        { id: 't2', ownerId: 'human', armyCount: 2 },
        { id: 't3', ownerId: 'human', armyCount: 2 },
      ],
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result.currentPlayerId).toBe('bot-0');
  });

  it('respects max iterations safety limit', () => {
    const players: PlayerSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
      id: `bot-${i}`,
      name: `Bot ${i}`,
      isBot: true,
      isEliminated: false,
      color: '#000',
    }));
    players.unshift({
      id: 'human',
      name: 'Human',
      isBot: false,
      isEliminated: false,
      color: '#f00',
    });
    const state = buildState({
      players,
      currentPlayerId: 'bot-0',
      phase: 'REINFORCE',
    });
    const result = runBotTurnsUntilHuman(state, MINI_MAP);
    expect(result).toBeDefined();
  });
});
