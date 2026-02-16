// Game state machine and action application (specs 004, 005)

import seedrandom from 'seedrandom';
import { resolveCombat, rollDice } from './combat';
import type {
  ActionPayload,
  ActionType,
  CardSnapshot,
  GameStateSnapshot,
  MapDefinition,
  PlayerSnapshot,
  TerritorySnapshot,
} from './types';

const CARD_TRADE_VALUES = [4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50];

export function createInitialState(
  gameId: string,
  map: MapDefinition,
  players: PlayerSnapshot[],
  seed: string,
): GameStateSnapshot {
  const territories: TerritorySnapshot[] = map.territories.map((t) => ({
    id: t.id,
    ownerId: null,
    armyCount: 0,
  }));

  const cards: CardSnapshot[] = [];

  // Distribute territories randomly
  const rng = seedrandom(seed);
  const shuffled = [...map.territories].sort(() => rng() - 0.5);
  const armiesPerPlayer = Math.floor(shuffled.length / players.length);

  players.forEach((player, i) => {
    const start = i * armiesPerPlayer;
    const end =
      i === players.length - 1 ? shuffled.length : start + armiesPerPlayer;
    for (let j = start; j < end; j++) {
      const t = territories.find((x) => x.id === shuffled[j]?.id);
      if (t) {
        t.ownerId = player.id;
        t.armyCount = 1;
      }
    }
  });

  // Place remaining armies (1 per territory)
  territories.forEach((t) => {
    if (t.ownerId && t.armyCount === 1) t.armyCount = 2;
  });

  const firstPlayer = players[0];
  if (!firstPlayer)
    throw new Error('createInitialState requires at least one player');
  return {
    gameId,
    revision: 0,
    phase: 'REINFORCE',
    currentPlayerId: firstPlayer.id,
    players,
    territories,
    cards,
    seed,
  };
}

function getRng(seed: string, revision: number) {
  return seedrandom(`${seed}-${revision}`);
}

export function computeReinforcement(
  state: GameStateSnapshot,
  map: MapDefinition,
  playerId: string,
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isEliminated) return 0;

  const owned = state.territories.filter((t) => t.ownerId === playerId);
  let armies = Math.max(3, Math.floor(owned.length / 3));

  for (const continent of map.continents) {
    const continentTerritories = map.territories.filter(
      (t) => t.continentId === continent.id,
    );
    const ownedInContinent = continentTerritories.every((t) =>
      state.territories.some((st) => st.id === t.id && st.ownerId === playerId),
    );
    if (ownedInContinent) armies += continent.bonus;
  }

  return armies;
}

export function applyAction(
  state: GameStateSnapshot,
  map: MapDefinition,
  action: ActionType,
  payload: ActionPayload,
): { state: GameStateSnapshot; error?: string } {
  const currentPlayer = state.players.find(
    (p) => p.id === state.currentPlayerId,
  );
  if (!currentPlayer || currentPlayer.isEliminated) {
    return { state, error: 'Invalid player' };
  }

  const nextState = JSON.parse(JSON.stringify(state)) as GameStateSnapshot;
  nextState.revision = state.revision + 1;

  switch (action) {
    case 'PLACE_ARMIES': {
      if (nextState.phase !== 'REINFORCE') {
        return { state, error: 'Can only place armies in REINFORCE phase' };
      }
      const p = payload as {
        placements: Array<{ territoryId: string; count: number }>;
      };
      const total = p.placements.reduce((s, x) => s + x.count, 0);
      const available = computeReinforcement(
        nextState,
        map,
        state.currentPlayerId,
      );
      if (total !== available) {
        return { state, error: `Must place exactly ${available} armies` };
      }
      for (const { territoryId, count } of p.placements) {
        const t = nextState.territories.find((x) => x.id === territoryId);
        if (!t || t.ownerId !== state.currentPlayerId) {
          return { state, error: 'Invalid territory' };
        }
        t.armyCount += count;
      }
      nextState.phase = 'ATTACK';
      return { state: nextState };
    }

    case 'ATTACK': {
      if (nextState.phase !== 'ATTACK') {
        return { state, error: 'Can only attack in ATTACK phase' };
      }
      const a = payload as {
        fromTerritoryId: string;
        toTerritoryId: string;
        attackerDice: 1 | 2 | 3;
      };
      const from = nextState.territories.find(
        (t) => t.id === a.fromTerritoryId,
      );
      const to = nextState.territories.find((t) => t.id === a.toTerritoryId);
      if (
        !from ||
        !to ||
        from.ownerId !== state.currentPlayerId ||
        to.ownerId === state.currentPlayerId
      ) {
        return { state, error: 'Invalid attack' };
      }
      const adj =
        map.territories.find((t) => t.id === from.id)?.adjacencies ?? [];
      if (!adj.includes(to.id))
        return { state, error: 'Territories not adjacent' };
      if (from.armyCount < a.attackerDice + 1) {
        return { state, error: 'Not enough armies to attack' };
      }
      const defenderDiceCount = Math.min(2, to.armyCount);
      const rng = getRng(nextState.seed, nextState.revision);
      const attackerDice = rollDice(a.attackerDice, rng);
      const defenderDice = rollDice(defenderDiceCount, rng);
      const result = resolveCombat(attackerDice, defenderDice);
      from.armyCount -= result.attackerLosses;
      to.armyCount -= result.defenderLosses;
      if (to.armyCount <= 0) {
        to.ownerId = state.currentPlayerId;
        to.armyCount = a.attackerDice;
        from.armyCount -= a.attackerDice;
        // Card earned - simplified: add card to player
        const newCard: CardSnapshot = {
          id: `card-${nextState.revision}-${Date.now()}`,
          ownerId: state.currentPlayerId,
          symbol: ['INFANTRY', 'CAVALRY', 'ARTILLERY'][
            Math.floor(rng() * 3)
          ] as CardSnapshot['symbol'],
          territoryId: to.id,
        };
        nextState.cards.push(newCard);
      }
      return { state: nextState };
    }

    case 'FORTIFY': {
      if (nextState.phase !== 'FORTIFY') {
        return { state, error: 'Can only fortify in FORTIFY phase' };
      }
      const f = payload as {
        fromTerritoryId: string;
        toTerritoryId: string;
        count: number;
      };
      const from = nextState.territories.find(
        (t) => t.id === f.fromTerritoryId,
      );
      const to = nextState.territories.find((t) => t.id === f.toTerritoryId);
      if (
        !from ||
        !to ||
        from.ownerId !== state.currentPlayerId ||
        to.ownerId !== state.currentPlayerId
      ) {
        return { state, error: 'Invalid fortify' };
      }
      const adj =
        map.territories.find((t) => t.id === from.id)?.adjacencies ?? [];
      if (!adj.includes(to.id))
        return { state, error: 'Territories not adjacent' };
      if (f.count < 1 || f.count >= from.armyCount) {
        return { state, error: 'Invalid fortify count' };
      }
      from.armyCount -= f.count;
      to.armyCount += f.count;
      return advanceTurn(nextState, map);
    }

    case 'END_TURN': {
      if (nextState.phase !== 'ATTACK' && nextState.phase !== 'FORTIFY') {
        return { state, error: 'Cannot end turn now' };
      }
      if (nextState.phase === 'ATTACK') {
        nextState.phase = 'FORTIFY';
        return { state: nextState };
      }
      return advanceTurn(nextState, map);
    }

    default:
      return { state, error: 'Unknown action' };
  }
}

function advanceTurn(
  state: GameStateSnapshot,
  _map: MapDefinition,
): { state: GameStateSnapshot } {
  const order = state.players
    .filter((p) => !p.isEliminated)
    .sort((a, b) => {
      const ai = state.players.indexOf(a);
      const bi = state.players.indexOf(b);
      return ai - bi;
    });
  const idx = order.findIndex((p) => p.id === state.currentPlayerId);
  const next = order[(idx + 1) % order.length];
  if (!next) return { state };

  state.currentPlayerId = next.id;
  state.phase = 'REINFORCE';

  // Check win condition
  const alive = order.filter((p) => !p.isEliminated);
  if (alive.length === 1) {
    // Game over - winner
    return { state };
  }

  return { state };
}

export function getCardTradeValue(setIndex: number): number {
  return CARD_TRADE_VALUES[setIndex] ?? 4 + setIndex * 5;
}
