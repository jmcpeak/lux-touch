#!/usr/bin/env node
/**
 * Generates world-paths.json and world.json from world-atlas TopoJSON.
 * Run: node scripts/generate-world-map.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { feature, neighbors } from 'topojson-client';
import { geoPath, geoMercator } from 'd3-geo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load world-atlas 110m (simpler shapes)
const worldAtlasPath = join(root, 'node_modules/world-atlas/countries-110m.json');
const topo = JSON.parse(readFileSync(worldAtlasPath, 'utf8'));

const countries = topo.objects.countries;
const collection = feature(topo, countries);

const EXCLUDE_NAMES = ['Antarctica', 'Fr. S. Antarctic Lands', 'S. Geo. and the Is.', 'Greenland'];

// South America: merge into 4 territories (Risk-style)
const SA_TERRITORY_GROUPS = {
  venezuela: ['Venezuela', 'Colombia', 'Guyana', 'Suriname'],
  peru: ['Peru', 'Ecuador', 'Bolivia'],
  brazil: ['Brazil', 'Paraguay', 'Uruguay'],
  argentina: ['Argentina', 'Chile', 'Falkland Is.'],
};

// North America + Central America: merge into 8 territories
const NA_TERRITORY_GROUPS = {
  canada: ['Canada'],
  'united-states': ['United States of America'],
  mexico: ['Mexico'],
  'central-america': [
    'Belize',
    'Guatemala',
    'Honduras',
    'El Salvador',
    'Nicaragua',
    'Costa Rica',
    'Panama',
  ],
  cuba: ['Cuba'],
  hispaniola: ['Haiti', 'Dominican Rep.'],
  caribbean: ['Jamaica', 'Puerto Rico'],
  'lesser-antilles': [
    'Bahamas',
    'Trinidad and Tobago',
    'St. Vincent and Gren.',
    'St. Kitts and Nevis',
    'Dominica',
    'Saint Lucia',
    'Grenada',
    'Barbados',
    'Antigua and Barbuda',
  ],
};

const filteredCollection = {
  type: 'FeatureCollection',
  features: collection.features.filter(
    (f) => !EXCLUDE_NAMES.includes(f.properties?.name ?? '')
  ),
};

// Project to 1000x600 viewBox - fit to included territories only (no Antarctica)
const projection = geoMercator().fitSize([1000, 600], filteredCollection);
const path = geoPath().projection(projection);

function slug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ISO numeric id -> continent (simplified mapping for 110m countries)
const CONTINENT_BY_ID = {
  // North America
  '124': 'na', '840': 'na', '484': 'na', '084': 'na', '188': 'na', '558': 'na',
  '340': 'na', '222': 'na', '320': 'na', '388': 'na', '192': 'na', '332': 'na',
  '214': 'na', '630': 'na', '136': 'na', '165': 'na',
  // South America
  '032': 'sa', '076': 'sa', '152': 'sa', '170': 'sa', '218': 'sa', '604': 'sa',
  '068': 'sa', '862': 'na', '328': 'sa', '740': 'sa', '858': 'sa', '600': 'sa',
  '238': 'sa', '780': 'na',
  // Europe
  '352': 'eu', '826': 'eu', '528': 'eu', '756': 'eu', '756': 'eu', '756': 'eu',
  '250': 'eu', '724': 'eu', '620': 'eu', '372': 'eu', '578': 'eu', '752': 'eu',
  '246': 'eu', '208': 'eu', '616': 'eu', '276': 'eu', '442': 'eu', '056': 'eu',
  '040': 'eu', '348': 'eu', '498': 'eu', '642': 'eu', '100': 'eu', '300': 'eu',
  '792': 'eu', '008': 'eu', '191': 'eu', '705': 'eu', '703': 'eu', '203': 'eu',
  '440': 'eu', '428': 'eu', '233': 'eu', '112': 'eu', '804': 'eu', '498': 'eu',
  '807': 'eu', '688': 'eu', '499': 'eu', '070': 'eu', '586': 'eu',
  // Africa
  '012': 'af', '024': 'af', '204': 'af', '072': 'af', '854': 'af', '108': 'af',
  '120': 'af', '266': 'af', '226': 'af', '148': 'af', '140': 'af', '178': 'af',
  '180': 'af', '324': 'af', '624': 'af', '430': 'af', '694': 'af', '270': 'af',
  '384': 'af', '288': 'af', '768': 'af', '466': 'af', '478': 'af', '562': 'af',
  '566': 'af', '686': 'af', '404': 'af', '454': 'af', '508': 'af', '516': 'af',
  '710': 'af', '426': 'af', '748': 'af', '834': 'af', '800': 'af', '646': 'af',
  '728': 'af', '729': 'af', '788': 'af', '434': 'af', '504': 'af', '732': 'af',
  '732': 'af', '450': 'af', '894': 'af', '716': 'af', '231': 'af', '262': 'af',
  '706': 'af', '232': 'af',
  // Asia
  '004': 'as', '031': 'as', '051': 'as', '050': 'as', '064': 'as', '356': 'as',
  '086': 'as', '096': 'as', '104': 'as', '116': 'as', '156': 'as', '158': 'as',
  '268': 'as', '360': 'as', '368': 'as', '376': 'as', '392': 'as', '398': 'as',
  '400': 'as', '408': 'as', '410': 'as', '414': 'as', '417': 'as', '418': 'as',
  '422': 'as', '458': 'as', '496': 'as', '512': 'as', '524': 'as', '586': 'as',
  '604': 'as', '634': 'as', '682': 'as', '704': 'as', '764': 'as', '784': 'as',
  '795': 'as', '860': 'as', '887': 'as', '762': 'as', '760': 'as',
  // Oceania
  '036': 'oc', '242': 'oc', '548': 'oc', '554': 'oc', '598': 'oc', '626': 'oc',
  '090': 'oc', '540': 'oc', '608': 'oc',
  // Antarctica
  '010': 'an', '260': 'an', '239': 'an', '238': 'sa',
};

const paths = {};
const coords = {};
const territories = [];
const ids = new Set();

// Collect SA and NA country features by group (for merging later)
const saGroups = {
  venezuela: [],
  peru: [],
  brazil: [],
  argentina: [],
};
const naGroups = {
  canada: [],
  'united-states': [],
  mexico: [],
  'central-america': [],
  cuba: [],
  hispaniola: [],
  caribbean: [],
  'lesser-antilles': [],
};
const countryToSaGroup = {};
const countryToNaGroup = {};
for (const [tid, names] of Object.entries(SA_TERRITORY_GROUPS)) {
  for (const n of names) countryToSaGroup[n] = tid;
}
for (const [tid, names] of Object.entries(NA_TERRITORY_GROUPS)) {
  for (const n of names) countryToNaGroup[n] = tid;
}

for (const f of filteredCollection.features) {
  const name = f.properties?.name;
  const id = f.id ? String(f.id) : null;
  if (!name || !id) continue;
  if (EXCLUDE_NAMES.includes(name)) continue;

  const slugId = slug(name);
  if (!slugId || ids.has(slugId)) continue;

  const saGroup = countryToSaGroup[name];
  if (saGroup) {
    saGroups[saGroup].push({ f, slugId });
    ids.add(slugId);
    continue;
  }

  const naGroup = countryToNaGroup[name];
  if (naGroup) {
    naGroups[naGroup].push({ f, slugId });
    ids.add(slugId);
    continue;
  }

  ids.add(slugId);

  const d = path(f);
  if (!d) continue;

  paths[slugId] = d;
  const continentId = CONTINENT_BY_ID[id] || 'as';
  territories.push({
    id: slugId,
    name,
    continentId,
    adjacencies: [], // filled below
  });

  const b = path.bounds(f);
  const cx = (b[0][0] + b[1][0]) / 2;
  const cy = (b[0][1] + b[1][1]) / 2;
  coords[slugId] = { x: Math.round(cx), y: Math.round(cy), r: 12 };
}

// Build byIndex and topoNeighbors (needed for SA adjacencies)
const topoNeighbors = neighbors(countries.geometries);
const byIndex = new Map();
countries.geometries.forEach((g, i) => {
  const name = g.properties?.name;
  const id = slug(name);
  if (id) byIndex.set(i, id);
});

const ALL_TERRITORY_GROUPS = { ...SA_TERRITORY_GROUPS, ...NA_TERRITORY_GROUPS };
function resolveTerritoryId(slugId) {
  const group = Object.keys(ALL_TERRITORY_GROUPS).find((k) =>
    ALL_TERRITORY_GROUPS[k].some((n) => slug(n) === slugId)
  );
  return group ?? slugId;
}

// Merge SA groups into 4 territories
const SA_NAMES = { venezuela: 'Venezuela', peru: 'Peru', brazil: 'Brazil', argentina: 'Argentina' };
for (const [tid, items] of Object.entries(saGroups)) {
  if (items.length === 0) continue;
  const pathStrs = items.map(({ f }) => path(f)).filter(Boolean);
  if (pathStrs.length === 0) continue;
  paths[tid] = pathStrs.join(' ');
  const allBounds = items.flatMap(({ f }) => {
    const b = path.bounds(f);
    return [b[0], b[1]];
  });
  const minX = Math.min(...allBounds.map((p) => p[0]));
  const maxX = Math.max(...allBounds.map((p) => p[0]));
  const minY = Math.min(...allBounds.map((p) => p[1]));
  const maxY = Math.max(...allBounds.map((p) => p[1]));
  coords[tid] = {
    x: Math.round((minX + maxX) / 2),
    y: Math.round((minY + maxY) / 2),
    r: 14,
  };
  const adjSet = new Set();
  for (const { slugId } of items) {
    const idx = countries.geometries.findIndex(
      (g) => slug(g.properties?.name) === slugId
    );
    if (idx >= 0) {
      for (const j of topoNeighbors[idx] || []) {
        const adjId = byIndex.get(j);
        if (!adjId) continue;
        const resolved = resolveTerritoryId(adjId);
        if (resolved !== tid && (ids.has(resolved) || Object.keys(ALL_TERRITORY_GROUPS).includes(resolved))) {
          adjSet.add(resolved);
        }
      }
    }
  }
  territories.push({
    id: tid,
    name: SA_NAMES[tid],
    continentId: 'sa',
    adjacencies: [...adjSet],
  });
  ids.add(tid);
}

// Merge NA groups into 9 territories
const NA_NAMES = {
  canada: 'Canada',
  'united-states': 'United States',
  mexico: 'Mexico',
  'central-america': 'Central America',
  cuba: 'Cuba',
  hispaniola: 'Hispaniola',
  caribbean: 'Caribbean',
  'lesser-antilles': 'Lesser Antilles',
};
for (const [tid, items] of Object.entries(naGroups)) {
  if (items.length === 0) continue;
  const pathStrs = items.map(({ f }) => path(f)).filter(Boolean);
  if (pathStrs.length === 0) continue;
  paths[tid] = pathStrs.join(' ');
  const allBounds = items.flatMap(({ f }) => {
    const b = path.bounds(f);
    return [b[0], b[1]];
  });
  const minX = Math.min(...allBounds.map((p) => p[0]));
  const maxX = Math.max(...allBounds.map((p) => p[0]));
  const minY = Math.min(...allBounds.map((p) => p[1]));
  const maxY = Math.max(...allBounds.map((p) => p[1]));
  coords[tid] = {
    x: Math.round((minX + maxX) / 2),
    y: Math.round((minY + maxY) / 2),
    r: 14,
  };
  const adjSet = new Set();
  for (const { slugId } of items) {
    const idx = countries.geometries.findIndex(
      (g) => slug(g.properties?.name) === slugId
    );
    if (idx >= 0) {
      for (const j of topoNeighbors[idx] || []) {
        const adjId = byIndex.get(j);
        if (!adjId) continue;
        const resolved = resolveTerritoryId(adjId);
        if (resolved !== tid && (ids.has(resolved) || Object.keys(ALL_TERRITORY_GROUPS).includes(resolved))) {
          adjSet.add(resolved);
        }
      }
    }
  }
  territories.push({
    id: tid,
    name: NA_NAMES[tid],
    continentId: 'na',
    adjacencies: [...adjSet],
  });
  ids.add(tid);
}

// Build adjacencies for non-merged territories
for (let i = 0; i < countries.geometries.length; i++) {
  const slugId = byIndex.get(i);
  if (!slugId) continue;
  const tid = resolveTerritoryId(slugId);
  if (!ids.has(tid)) continue;
  if (Object.keys(ALL_TERRITORY_GROUPS).includes(tid)) continue; // merged territories already have adjacencies
  const adj = topoNeighbors[i] || [];
  const adjIds = [...new Set(adj.map((j) => resolveTerritoryId(byIndex.get(j) ?? '')).filter((a) => a && ids.has(a) && a !== tid))];
  const t = territories.find((x) => x.id === tid);
  if (t) t.adjacencies = adjIds;
}

const continents = [
  { id: 'na', name: 'North America & Central America', bonus: 5 },
  { id: 'sa', name: 'South America', bonus: 2 },
  { id: 'eu', name: 'Europe', bonus: 5 },
  { id: 'af', name: 'Africa', bonus: 3 },
  { id: 'as', name: 'Asia', bonus: 7 },
  { id: 'oc', name: 'Oceania', bonus: 2 },
];

const mapDef = {
  id: 'world',
  name: 'World',
  territories,
  continents,
};

writeFileSync(join(root, 'src/data/maps/world-paths.json'), JSON.stringify(paths, null, 0));
writeFileSync(join(root, 'src/data/maps/world-coords.json'), JSON.stringify(coords, null, 2));
writeFileSync(join(root, 'src/data/maps/world.json'), JSON.stringify(mapDef, null, 2));
console.log(`Generated ${Object.keys(paths).length} territories`);
console.log('Wrote world-paths.json, world-coords.json, world.json');
