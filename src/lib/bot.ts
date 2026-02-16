/**
 * Inline bot execution (spec 015).
 * Bots run synchronously in the same request as human actions.
 */
import { applyAction, computeReinforcement } from './game-engine';
import type { GameStateSnapshot, MapDefinition } from './types';

export function runBotTurnsUntilHuman(
  state: GameStateSnapshot,
  map: MapDefinition,
): GameStateSnapshot {
  let current = state;
  const maxIterations = 100;
  let i = 0;

  while (i < maxIterations) {
    const player = current.players.find(
      (p) => p.id === current.currentPlayerId,
    );
    if (!player || player.id === 'human') break;

    const result = runOneBotAction(current, map);
    if (!result) break;
    current = result;
    i++;
  }

  return current;
}

function runOneBotAction(
  state: GameStateSnapshot,
  map: MapDefinition,
): GameStateSnapshot | null {
  const player = state.players.find((p) => p.id === state.currentPlayerId);
  if (!player || player.id === 'human') return null;

  if (state.phase === 'REINFORCE') {
    const armies = computeReinforcement(state, map, player.id);
    const myTerritories = state.territories.filter(
      (t) => t.ownerId === player.id,
    );
    if (myTerritories.length === 0 || armies <= 0) return null;
    const placements = myTerritories.map((t) => ({
      territoryId: t.id,
      count: 0,
    }));
    let remaining = armies;
    let idx = 0;
    while (remaining > 0) {
      const p = placements[idx % placements.length];
      if (p) p.count++;
      remaining--;
      idx++;
    }
    const { state: next, error } = applyAction(state, map, 'PLACE_ARMIES', {
      placements: placements.filter((p) => p.count > 0),
    });
    if (error) return null;
    return next;
  }

  if (state.phase === 'ATTACK') {
    const myTerritories = state.territories.filter(
      (t) => t.ownerId === player.id && t.armyCount >= 4,
    );
    for (const from of myTerritories) {
      const adj =
        map.territories.find((t) => t.id === from.id)?.adjacencies ?? [];
      for (const adjId of adj) {
        const to = state.territories.find((t) => t.id === adjId);
        if (to && to.ownerId !== player.id) {
          const dice = Math.min(3, from.armyCount - 1) as 1 | 2 | 3;
          const { state: next, error } = applyAction(state, map, 'ATTACK', {
            fromTerritoryId: from.id,
            toTerritoryId: to.id,
            attackerDice: dice,
          });
          if (!error) return next;
        }
      }
    }
    const { state: next, error } = applyAction(state, map, 'END_TURN', {});
    if (error) return null;
    return next;
  }

  if (state.phase === 'FORTIFY') {
    const { state: next, error } = applyAction(state, map, 'END_TURN', {});
    if (error) return null;
    return next;
  }

  return null;
}
