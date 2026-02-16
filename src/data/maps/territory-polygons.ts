/**
 * Voronoi polygon cells for each territory.
 * Generated from territory centers using d3-delaunay.
 * Territory order matches classic.json territories array.
 */
import { Delaunay } from 'd3-delaunay';
import { TERRITORY_COORDS, MAP_VIEWBOX } from './classic-coords';

const TERRITORY_ORDER = [
  'alaska', 'northwest-territory', 'greenland', 'alberta', 'ontario', 'quebec',
  'western-united-states', 'eastern-united-states', 'central-america',
  'venezuela', 'peru', 'brazil', 'argentina',
  'iceland', 'great-britain', 'scandinavia', 'northern-europe', 'southern-europe',
  'ukraine', 'western-europe',
  'north-africa', 'egypt', 'east-africa', 'congo', 'south-africa', 'madagascar',
  'middle-east', 'afghanistan', 'ural', 'siberia', 'yakutsk', 'kamchatka',
  'irkutsk', 'mongolia', 'japan', 'china', 'india', 'southeast-asia',
  'indonesia', 'new-guinea', 'eastern-australia', 'western-australia',
] as const;

const bounds: [number, number, number, number] = [
  0, 0, MAP_VIEWBOX.width, MAP_VIEWBOX.height,
];

const points: [number, number][] = TERRITORY_ORDER.map((id) => {
  const c = TERRITORY_COORDS[id];
  return c ? [c.x, c.y] : [0, 0];
});

const delaunay = Delaunay.from(points);
const voronoi = delaunay.voronoi(bounds);

/** Territory ID -> SVG path string for the Voronoi cell polygon */
export const TERRITORY_PATHS: Record<string, string> = {};

for (let i = 0; i < TERRITORY_ORDER.length; i++) {
  const id = TERRITORY_ORDER[i];
  const cell = voronoi.cellPolygon(i);
  if (cell && cell.length > 0) {
    const path =
      cell.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') +
      ' Z';
    TERRITORY_PATHS[id] = path;
  }
}

/** Territory ID -> Voronoi cell index (for hit testing) */
export const TERRITORY_INDEX: Record<string, number> = {};
for (let i = 0; i < TERRITORY_ORDER.length; i++) {
  TERRITORY_INDEX[TERRITORY_ORDER[i]] = i;
}

export { voronoi, delaunay, points, TERRITORY_ORDER };
