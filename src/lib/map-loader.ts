import type { MapDefinition } from './types';

let cachedClassic: MapDefinition | null = null;
let cachedWorld: MapDefinition | null = null;

export function getMap(mapId: string): MapDefinition | null {
  if (mapId === 'classic') {
    if (!cachedClassic) {
      cachedClassic = require('@/data/maps/classic.json') as MapDefinition;
    }
    return cachedClassic;
  }
  if (mapId === 'world') {
    if (!cachedWorld) {
      cachedWorld = require('@/data/maps/world.json') as MapDefinition;
    }
    return cachedWorld;
  }
  return null;
}
