import type { GameStateSnapshot, MapDefinition } from './types';

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
