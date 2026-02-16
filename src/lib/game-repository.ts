/**
 * Game persistence (spec 014).
 * CRUD operations for games via Prisma.
 */
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';
import { createInitialState } from '@/lib/game-engine';
import { getMap } from '@/lib/map-loader';
import type { GameStateSnapshot, MapDefinition, PlayerSnapshot } from '@/lib/types';

const PLAYER_COLORS = [
  '#e11d48', // red
  '#2563eb', // blue
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#0891b2', // cyan
];

export interface CreateGameParams {
  mapId: string;
  playerCount: number;
  userId?: string | null;
}

export async function createGame(params: CreateGameParams): Promise<{
  gameId: string;
  accessToken: string;
  state: GameStateSnapshot;
  map: MapDefinition;
}> {
  const { mapId, playerCount, userId } = params;
  const map = getMap(mapId);
  if (!map) throw new Error('Map not found');

  const count = Math.min(6, Math.max(2, playerCount));
  const seed = nanoid(16);
  const accessToken = nanoid(16);

  const players: PlayerSnapshot[] = [
    {
      id: 'human',
      name: 'You',
      isBot: false,
      isEliminated: false,
      color: PLAYER_COLORS[0] ?? '#e11d48',
    },
    ...Array.from({ length: count - 1 }, (_, i) => ({
      id: `bot-${i}`,
      name: `Bot ${i + 1}`,
      isBot: true,
      isEliminated: false,
      color: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length] ?? '#2563eb',
    })),
  ];

  const state = createInitialState('', map, players, seed);

  const game = await prisma.game.create({
    data: {
      userId: userId ?? null,
      mapId,
      status: 'ACTIVE',
      seed,
      accessToken,
      players: {
        create: players.map((p, i) => ({
          logicalId: p.id,
          name: p.name,
          isBot: p.isBot,
          color: p.color,
          orderIndex: i,
        })),
      },
      states: {
        create: {
          revision: state.revision,
          phase: state.phase,
          currentPlayerId: state.currentPlayerId,
          stateJson: state as unknown as object,
        },
      },
    },
    include: {
      states: true,
    },
  });

  const stateWithGameId: GameStateSnapshot = {
    ...state,
    gameId: game.id,
  };

  return {
    gameId: game.id,
    accessToken,
    state: stateWithGameId,
    map,
  };
}

export async function getGameWithState(
  gameId: string,
): Promise<{ game: { id: string; status: string; mapId: string }; state: GameStateSnapshot; map: MapDefinition } | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { states: true },
  });
  if (!game) return null;

  const stateRow = game.states[0];
  if (!stateRow) return null;

  const map = getMap(game.mapId);
  if (!map) return null;

  const state = stateRow.stateJson as unknown as GameStateSnapshot;
  state.gameId = game.id;

  return {
    game: { id: game.id, status: game.status, mapId: game.mapId },
    state,
    map,
  };
}

export async function updateGameState(
  gameId: string,
  state: GameStateSnapshot,
): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { states: true },
  });
  if (!game) throw new Error('Game not found');

  const stateRow = game.states[0];
  if (!stateRow) throw new Error('Game state not found');

  const winner = state.players.filter((p) => !p.isEliminated);
  const status = winner.length <= 1 ? 'COMPLETED' : 'ACTIVE';

  await prisma.$transaction([
    prisma.gameState.update({
      where: { id: stateRow.id },
      data: {
        revision: state.revision,
        phase: state.phase,
        currentPlayerId: state.currentPlayerId,
        stateJson: state as unknown as object,
      },
    }),
    prisma.game.update({
      where: { id: gameId },
      data: { status },
    }),
  ]);
}

export async function listUserGames(userId: string, status?: string) {
  return prisma.game.findMany({
    where: {
      userId,
      ...(status && { status: status as 'ACTIVE' | 'COMPLETED' | 'ABANDONED' }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      mapId: true,
      createdAt: true,
    },
  });
}

export async function deleteGame(gameId: string, userId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });
  if (!game || game.userId !== userId) return false;

  await prisma.game.delete({
    where: { id: gameId },
  });
  return true;
}
