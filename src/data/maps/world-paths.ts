/**
 * World map paths from Natural Earth (world-atlas 110m).
 * Paths are already in 1000x600 viewBox (no transform).
 */
import worldPathsRaw from './world-paths.json';
import worldCoords from './world-coords.json';

/** Territory ID -> SVG path d string (in 1000x600 view coords) */
export const WORLD_PATHS: Record<string, string> =
  worldPathsRaw as Record<string, string>;

/** Territory ID -> { x, y, r } for badge placement */
export const WORLD_COORDS: Record<string, { x: number; y: number; r?: number }> =
  worldCoords as Record<string, { x: number; y: number; r?: number }>;

/** World paths use view coords directly - identity transform */
export function worldFromViewCoords(vx: number, vy: number): [number, number] {
  return [vx, vy];
}
