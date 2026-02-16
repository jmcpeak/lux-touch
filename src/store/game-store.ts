'use client';

import { create } from 'zustand';
import type {
  ActionRequest,
  GameStateSnapshot,
  MapDefinition,
  PlaceArmiesPayload,
} from '@/lib/types';

interface GameStore {
  gameId: string | null;
  state: GameStateSnapshot | null;
  map: MapDefinition | null;
  error: string | null;
  isLoading: boolean;

  createGame: (playerCount?: number, mapId?: string) => Promise<void>;
  submitAction: (
    action: ActionRequest['action'],
    payload: ActionRequest['payload'],
  ) => Promise<void>;
  placeArmies: (placements: PlaceArmiesPayload['placements']) => Promise<void>;
  attack: (from: string, to: string, dice: 1 | 2 | 3) => Promise<void>;
  fortify: (from: string, to: string, count: number) => Promise<void>;
  endTurn: () => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameId: null,
  state: null,
  map: null,
  error: null,
  isLoading: false,

  createGame: async (playerCount = 4, mapId = 'classic') => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerCount, mapId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create game');
      set({
        gameId: data.gameId,
        state: data.state,
        map: data.map,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to create game',
      });
    }
  },

  submitAction: async (action, payload) => {
    const { gameId } = get();
    if (!gameId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/games/${gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, action, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      set({ state: data.state, isLoading: false, error: null });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Action failed',
      });
    }
  },

  placeArmies: async (placements) => {
    await get().submitAction('PLACE_ARMIES', { placements });
  },

  attack: async (from, to, dice) => {
    await get().submitAction('ATTACK', {
      fromTerritoryId: from,
      toTerritoryId: to,
      attackerDice: dice,
    });
  },

  fortify: async (from, to, count) => {
    await get().submitAction('FORTIFY', {
      fromTerritoryId: from,
      toTerritoryId: to,
      count,
    });
  },

  endTurn: async () => {
    await get().submitAction('END_TURN', {});
  },

  reset: () => set({ gameId: null, state: null, map: null, error: null }),
}));
