import { describe, expect, it, vi } from 'vitest';
import {
  createGame,
  deleteGame,
  getGameWithState,
  listUserGames,
  updateGameState,
} from '../game-repository';

vi.mock('@/lib/db', () => ({
  prisma: {
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    gameState: {
      update: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));
vi.mock('@/lib/map-loader', () => ({
  getMap: vi.fn((id: string) =>
    id === 'classic'
      ? {
          id: 'classic',
          name: 'Classic',
          territories: [
            { id: 't1', continentId: 'c1', adjacencies: ['t2'] },
            { id: 't2', continentId: 'c1', adjacencies: ['t1'] },
          ],
          continents: [{ id: 'c1', bonus: 2 }],
        }
      : null,
  ),
}));

const { prisma } = await import('@/lib/db');

describe('createGame', () => {
  it('throws when map not found', async () => {
    await expect(
      createGame({ mapId: 'nonexistent', playerCount: 2 }),
    ).rejects.toThrow('Map not found');
  });

  it('creates game with correct structure', async () => {
    const mockGame = {
      id: 'game-uuid',
      userId: null,
      mapId: 'classic',
      status: 'ACTIVE',
      seed: 'seed',
      accessToken: 'token',
      players: [],
      states: [],
    };
    vi.mocked(prisma.game.create).mockResolvedValue(mockGame as any);

    const result = await createGame({
      mapId: 'classic',
      playerCount: 2,
      userId: null,
    });

    expect(result.gameId).toBe('game-uuid');
    expect(result.accessToken).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.state.phase).toBe('REINFORCE');
    expect(result.state.players).toHaveLength(2);
    expect(result.state.players[0]?.id).toBe('human');
    expect(result.state.players[1]?.id).toBe('bot-0');
  });
});

describe('getGameWithState', () => {
  it('returns null when game not found', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue(null);
    const result = await getGameWithState('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null when map not found', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'g1',
      mapId: 'nonexistent-map',
      status: 'ACTIVE',
      states: [{ stateJson: { gameId: 'g1' } }],
    } as any);
    const result = await getGameWithState('g1');
    expect(result).toBeNull();
  });
});

describe('listUserGames', () => {
  it('returns games for user', async () => {
    vi.mocked(prisma.game.findMany).mockResolvedValue([
      {
        id: 'g1',
        status: 'ACTIVE',
        mapId: 'classic',
        createdAt: new Date(),
      },
    ] as any);
    const games = await listUserGames('user-1');
    expect(games).toHaveLength(1);
    expect(games[0]?.id).toBe('g1');
  });

  it('filters by status when provided', async () => {
    vi.mocked(prisma.game.findMany).mockResolvedValue([]);
    await listUserGames('user-1', 'ACTIVE');
    expect(prisma.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });
});

describe('deleteGame', () => {
  it('returns false when game not found', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue(null);
    const result = await deleteGame('g1', 'user-1');
    expect(result).toBe(false);
  });

  it('returns false when user does not own game', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'g1',
      userId: 'other-user',
    } as any);
    const result = await deleteGame('g1', 'user-1');
    expect(result).toBe(false);
  });

  it('deletes and returns true when user owns game', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'g1',
      userId: 'user-1',
    } as any);
    vi.mocked(prisma.game.delete).mockResolvedValue({} as any);
    const result = await deleteGame('g1', 'user-1');
    expect(result).toBe(true);
    expect(prisma.game.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });
});
