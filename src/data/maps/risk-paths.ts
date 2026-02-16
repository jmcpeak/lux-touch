/**
 * Real Risk territory paths from Wikimedia SVG.
 * Transform: layer translate(-168,-119), scale to fit 1000x600.
 */
import riskPathsRaw from './risk-paths-raw.json';

export const TX = 167.99651;
export const TY = 118.55507;
const SVG_W = 749.82;
const SVG_H = 519.07;
const OUT_W = 1000;
const OUT_H = 600;
export const SCALE = Math.min(OUT_W / SVG_W, OUT_H / SVG_H);
export const OFF_X = (OUT_W - SVG_W * SCALE) / 2;
export const OFF_Y = (OUT_H - SVG_H * SCALE) / 2;

/** Transform from SVG path coords to our 1000x600 viewBox */
export function toViewCoords(x: number, y: number): [number, number] {
  const docX = x - TX;
  const docY = y - TY;
  return [docX * SCALE + OFF_X, docY * SCALE + OFF_Y];
}

/** Inverse: from view coords to SVG path coords */
export function fromViewCoords(vx: number, vy: number): [number, number] {
  const docX = (vx - OFF_X) / SCALE;
  const docY = (vy - OFF_Y) / SCALE;
  return [docX + TX, docY + TY];
}

/** Territory ID -> raw SVG path d string (in SVG layer coords) */
export const RISK_PATHS: Record<string, string> =
  riskPathsRaw as Record<string, string>;

/** Territory IDs that have real paths */
export const RISK_TERRITORY_IDS = Object.keys(RISK_PATHS);
