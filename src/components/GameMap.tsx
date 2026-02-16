'use client';

import Box from '@mui/material/Box';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameStateSnapshot, MapDefinition } from '@/lib/types';
import { MAP_VIEWBOX, TERRITORY_COORDS } from '@/data/maps/classic-coords';
import {
  RISK_PATHS,
  fromViewCoords,
  OFF_X,
  OFF_Y,
  SCALE,
  TX,
  TY,
} from '@/data/maps/risk-paths';
import {
  WORLD_PATHS,
  worldFromViewCoords,
  WORLD_COORDS,
} from '@/data/maps/world-paths';

interface GameMapProps {
  state: GameStateSnapshot;
  map: MapDefinition;
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  clickableIds?: Set<string>;
  placementDraft?: Record<string, number>;
}

const NEUTRAL_COLOR = '#6b7280';
const BORDER_COLOR = '#374151';
const HIGHLIGHT_STROKE = '#3b82f6';
const OCEAN_COLOR = '#1e3a5f';

export function GameMap({
  state,
  map,
  selectedTerritoryId,
  onTerritoryClick,
  clickableIds,
  placementDraft = {},
}: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState({ sx: 1, sy: 1, offX: 0, offY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 0, height: 0 };
      if (width <= 0 || height <= 0) return;
      const { width: vw, height: vh } = MAP_VIEWBOX;
      const sx = width / vw;
      const sy = height / vh;
      const s = Math.min(sx, sy);
      setScale({
        sx: s,
        sy: s,
        offX: (width - vw * s) / 2,
        offY: (height - vh * s) / 2,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { width: cw, height: ch } = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);

    const { sx, sy, offX, offY } = scale;
    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(sx, sy);

    // Parchment-style ocean background
    ctx.fillStyle = OCEAN_COLOR;
    ctx.fillRect(0, 0, MAP_VIEWBOX.width, MAP_VIEWBOX.height);

    const isWorld = map.id === 'world';
    const paths = isWorld ? WORLD_PATHS : RISK_PATHS;
    const coords = isWorld ? WORLD_COORDS : TERRITORY_COORDS;

    // Draw territories
    ctx.save();
    if (!isWorld) {
      ctx.translate(OFF_X, OFF_Y);
      ctx.scale(SCALE, SCALE);
      ctx.translate(-TX, -TY);
    }

    const { territories, players } = state;
    for (const t of map.territories) {
      const pathStr = paths[t.id];
      if (!pathStr) continue;

      const terr = territories.find((x) => x.id === t.id);
      const owner = terr?.ownerId
        ? players.find((p) => p.id === terr.ownerId)
        : null;
      const fill = owner?.color ?? NEUTRAL_COLOR;
      const isSelected = selectedTerritoryId === t.id;
      const isClickable = clickableIds?.has(t.id) ?? true;

      const path = new Path2D(pathStr);
      ctx.fillStyle = fill;
      ctx.fill(path);
      ctx.strokeStyle = isSelected ? HIGHLIGHT_STROKE : BORDER_COLOR;
      ctx.lineWidth = isSelected ? 4 : 1.5;
      ctx.stroke(path);

      if (!isClickable && !isSelected) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill(path);
      }
    }

    ctx.restore();

    // Army count badges (circular blobs) and labels
    for (const t of map.territories) {
      const terr = territories.find((x) => x.id === t.id);
      const owner = terr?.ownerId
        ? players.find((p) => p.id === terr.ownerId)
        : null;
      const fill = owner?.color ?? NEUTRAL_COLOR;
      const draft = placementDraft[t.id] ?? 0;
      const armyCount = (terr?.armyCount ?? 0) + draft;
      const c = coords[t.id];
      if (!c) continue;

      const badgeR = 14;
      const gradient = ctx.createRadialGradient(
        c.x - 4,
        c.y - 4,
        0,
        c.x,
        c.y,
        badgeR,
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
      gradient.addColorStop(0.5, fill);
      gradient.addColorStop(1, fill);

      ctx.beginPath();
      ctx.arc(c.x, c.y, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(String(armyCount), c.x, c.y);
    }

    ctx.restore();
  }, [state, map, selectedTerritoryId, clickableIds, placementDraft, scale]);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { sx, sy, offX, offY } = scale;
      const px = (e.clientX - rect.left - offX) / sx;
      const py = (e.clientY - rect.top - offY) / sy;

      const isWorld = map.id === 'world';
      const paths = isWorld ? WORLD_PATHS : RISK_PATHS;
      const toPathCoords = isWorld ? worldFromViewCoords : fromViewCoords;
      const [sxCoord, syCoord] = toPathCoords(px, py);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      for (const t of map.territories) {
        const pathStr = paths[t.id];
        if (!pathStr) continue;
        const path = new Path2D(pathStr);
        if (ctx.isPointInPath(path, sxCoord, syCoord)) {
          onTerritoryClick(t.id);
          ctx.restore();
          return;
        }
      }

      ctx.restore();
    },
    [scale, map.territories, onTerritoryClick],
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}`,
        maxHeight: '70vh',
        borderRadius: 1,
        overflow: 'hidden',
        touchAction: 'none',
        bgcolor: 'background.default',
        boxShadow: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: clickableIds ? 'pointer' : 'default',
        }}
        onPointerDown={handlePointer}
      />
    </Box>
  );
}
