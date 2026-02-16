/**
 * Territory center coordinates for classic Risk map.
 * ViewBox: 1000 x 600. Used for Canvas/SVG rendering.
 * Layout approximates classic Risk board geography.
 */
export const TERRITORY_COORDS: Record<
  string,
  { x: number; y: number; r?: number }
> = {
  // North America
  alaska: { x: 85, y: 95, r: 42 },
  'northwest-territory': { x: 140, y: 120, r: 42 },
  greenland: { x: 280, y: 85, r: 42 },
  alberta: { x: 120, y: 175, r: 42 },
  ontario: { x: 195, y: 165, r: 42 },
  quebec: { x: 265, y: 165, r: 42 },
  'western-united-states': { x: 130, y: 245, r: 42 },
  'eastern-united-states': { x: 220, y: 235, r: 42 },
  'central-america': { x: 175, y: 315, r: 38 },
  // South America
  venezuela: { x: 245, y: 340, r: 38 },
  peru: { x: 220, y: 420, r: 42 },
  brazil: { x: 295, y: 400, r: 45 },
  argentina: { x: 250, y: 520, r: 42 },
  // Europe
  iceland: { x: 320, y: 95, r: 32 },
  'great-britain': { x: 340, y: 155, r: 38 },
  scandinavia: { x: 400, y: 115, r: 42 },
  'northern-europe': { x: 380, y: 195, r: 42 },
  'southern-europe': { x: 400, y: 265, r: 38 },
  ukraine: { x: 470, y: 195, r: 45 },
  'western-europe': { x: 340, y: 245, r: 38 },
  // Africa
  'north-africa': { x: 380, y: 340, r: 45 },
  egypt: { x: 450, y: 320, r: 38 },
  'east-africa': { x: 470, y: 400, r: 42 },
  congo: { x: 420, y: 420, r: 38 },
  'south-africa': { x: 430, y: 510, r: 42 },
  madagascar: { x: 530, y: 480, r: 35 },
  // Asia
  'middle-east': { x: 480, y: 300, r: 42 },
  afghanistan: { x: 540, y: 250, r: 42 },
  ural: { x: 560, y: 145, r: 42 },
  siberia: { x: 640, y: 130, r: 45 },
  yakutsk: { x: 720, y: 95, r: 42 },
  kamchatka: { x: 820, y: 95, r: 42 },
  irkutsk: { x: 700, y: 175, r: 42 },
  mongolia: { x: 720, y: 245, r: 42 },
  japan: { x: 820, y: 245, r: 35 },
  china: { x: 640, y: 300, r: 50 },
  india: { x: 580, y: 360, r: 45 },
  'southeast-asia': { x: 660, y: 400, r: 42 },
  // Australia
  indonesia: { x: 640, y: 460, r: 38 },
  'new-guinea': { x: 750, y: 420, r: 38 },
  'eastern-australia': { x: 780, y: 500, r: 42 },
  'western-australia': { x: 680, y: 520, r: 45 },
};

export const MAP_VIEWBOX = { width: 1000, height: 600 };
