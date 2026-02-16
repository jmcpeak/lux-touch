'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import type { GameStateSnapshot, MapDefinition } from '@/lib/types';
import { useGameStore } from '@/store/game-store';
import { GameMap } from './GameMap';

interface GameBoardProps {
  state: GameStateSnapshot;
  map: MapDefinition;
  isMyTurn: boolean;
  reinforcement: number;
}

export function GameBoard({
  state,
  map,
  isMyTurn,
  reinforcement,
}: GameBoardProps) {
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(
    null,
  );
  const [placementDraft, setPlacementDraft] = useState<Record<string, number>>(
    {},
  );
  const { placeArmies, attack, fortify, endTurn } = useGameStore();

  const currentPlayer = state.players.find(
    (p) => p.id === state.currentPlayerId,
  );
  const myTerritories = state.territories.filter((t) => t.ownerId === 'human');
  const getTerritory = (id: string) =>
    state.territories.find((t) => t.id === id);
  const getMapTerritory = (id: string) =>
    map.territories.find((t) => t.id === id);

  const handlePlaceReinforcement = () => {
    const placements = Object.entries(placementDraft)
      .filter(([, c]) => c > 0)
      .map(([territoryId, count]) => ({ territoryId, count }));
    const total = placements.reduce((s, p) => s + p.count, 0);
    if (total === reinforcement) {
      placeArmies(placements);
      setPlacementDraft({});
      setSelectedTerritory(null);
    }
  };

  const placedSoFar = Object.values(placementDraft).reduce((a, b) => a + b, 0);
  const canPlace = placedSoFar === reinforcement && reinforcement > 0;

  const handleTerritoryClick = (territoryId: string) => {
    if (state.phase === 'REINFORCE' && isMyTurn && reinforcement > 0) {
      const terr = getTerritory(territoryId);
      if (terr?.ownerId === 'human' && placedSoFar < reinforcement) {
        setPlacementDraft((d) => ({
          ...d,
          [territoryId]: (d[territoryId] ?? 0) + 1,
        }));
      }
      return;
    }

    if (state.phase === 'ATTACK' && isMyTurn) {
      const from = selectedTerritory ? getTerritory(selectedTerritory) : null;
      const mapT = from ? getMapTerritory(from.id) : null;
      const adj = mapT ? mapT.adjacencies : [];
      const target = getTerritory(territoryId);
      const isMine = target?.ownerId === 'human';

      if (isMine && (target?.armyCount ?? 0) >= 2) {
        setSelectedTerritory(selectedTerritory === territoryId ? null : territoryId);
      } else if (
        from &&
        target &&
        !isMine &&
        adj.includes(territoryId) &&
        from.armyCount >= 4
      ) {
        attack(
          from.id,
          territoryId,
          Math.min(3, from.armyCount - 1) as 1 | 2 | 3,
        );
        setSelectedTerritory(null);
      }
      return;
    }

    if (state.phase === 'FORTIFY' && isMyTurn) {
      const from = selectedTerritory ? getTerritory(selectedTerritory) : null;
      const mapT = from ? getMapTerritory(from.id) : null;
      const adj = mapT ? mapT.adjacencies : [];
      const target = getTerritory(territoryId);
      const isMine = target?.ownerId === 'human';

      if (isMine && (target?.armyCount ?? 0) > 1) {
        setSelectedTerritory(selectedTerritory === territoryId ? null : territoryId);
      } else if (
        from &&
        target &&
        isMine &&
        adj.includes(territoryId) &&
        territoryId !== from.id
      ) {
        const count = Math.min(from.armyCount - 1, 5);
        fortify(from.id, territoryId, count);
        setSelectedTerritory(null);
      }
    }
  };

  const clickableIds = useMemo(() => {
    const ids = new Set<string>();
    const fromTerr = selectedTerritory
      ? state.territories.find((t) => t.id === selectedTerritory)
      : null;
    const fromMapT = fromTerr
      ? map.territories.find((t) => t.id === fromTerr.id)
      : null;
    const adj = fromMapT?.adjacencies ?? [];

    if (state.phase === 'REINFORCE' && isMyTurn && reinforcement > 0) {
      for (const t of myTerritories) ids.add(t.id);
    } else if (state.phase === 'ATTACK' && isMyTurn) {
      for (const t of state.territories) {
        const isMine = t.ownerId === 'human';
        const canFrom = isMine && t.armyCount >= 2;
        const canTarget =
          fromTerr &&
          !isMine &&
          adj.includes(t.id) &&
          (fromTerr.armyCount ?? 0) >= 4;
        if (canFrom || canTarget) ids.add(t.id);
      }
    } else if (state.phase === 'FORTIFY' && isMyTurn) {
      for (const t of state.territories) {
        const isMine = t.ownerId === 'human';
        const canFrom = isMine && t.armyCount > 1;
        const canTarget =
          fromTerr && isMine && adj.includes(t.id) && t.id !== fromTerr.id;
        if (canFrom || canTarget) ids.add(t.id);
      }
    } else {
      for (const t of state.territories) ids.add(t.id);
    }
    return ids;
  }, [
    state.phase,
    state.territories,
    isMyTurn,
    reinforcement,
    selectedTerritory,
    myTerritories,
    map.territories,
  ]);

  const mapSection = (
    <GameMap
      state={state}
      map={map}
      selectedTerritoryId={selectedTerritory}
      onTerritoryClick={handleTerritoryClick}
      clickableIds={clickableIds}
      placementDraft={state.phase === 'REINFORCE' ? placementDraft : undefined}
    />
  );

  if (state.phase === 'REINFORCE' && isMyTurn && reinforcement > 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Place {reinforcement} armies. Tap territories to add. ({placedSoFar}/
          {reinforcement})
        </Typography>
        {mapSection}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePlaceReinforcement}
            disabled={!canPlace}
          >
            Place Armies
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setPlacementDraft({})}
          >
            Reset
          </Button>
        </Box>
      </Box>
    );
  }

  if (state.phase === 'ATTACK' && isMyTurn) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Attack: select your territory, then an enemy. Or end turn.
        </Typography>
        {mapSection}
        <Button variant="contained" color="primary" onClick={() => endTurn()}>
          End Attack Phase
        </Button>
      </Box>
    );
  }

  if (state.phase === 'FORTIFY' && isMyTurn) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Fortify: move armies from one territory to an adjacent friendly.
        </Typography>
        {mapSection}
        <Button variant="contained" color="primary" onClick={() => endTurn()}>
          End Turn
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography color="text.secondary">
        {currentPlayer?.isBot ? "Bot's turn..." : 'Waiting...'}
      </Typography>
      {mapSection}
    </Box>
  );
}
