# 021 - Map Rendering

SVG structure, hit targets, labels, and colors.

## Overview

- **Format:** SVG
- **Map data:** From [006-map-format](../006-map-format/spec.md)
- **Interactivity:** Territory click/hover for selection; touch-friendly hit targets

## SVG Structure

```xml
<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients, filters -->
  </defs>
  <g id="territories">
    <path id="alaska" d="..." fill="..." data-territory-id="alaska" />
    <!-- ... -->
  </g>
  <g id="labels">
    <text x="..." y="...">Alaska</text>
    <text x="..." y="...">5</text> <!-- army count -->
  </g>
</g>
</svg>
```

## Territory Paths

- Each territory is a `<path>` or `<polygon>` with `data-territory-id`
- Paths can be generated from GeoJSON or hand-drawn for classic map
- Alternative: use pre-built SVG from Lux/Risk assets (license permitting) or create from map definition

## Colors

- **Fill:** Player color when owned; neutral gray when unowned (setup)
- **Stroke:** Darker shade for border; highlight on hover/select
- **Continent:** Optional subtle tint per continent for visual grouping

## Hit Targets

- Each territory path is a click target
- Minimum touch target: 44x44px (accessibility)
- Use `pointer-events` to ensure paths are clickable
- Consider invisible larger hit area for small territories (e.g., `filter: drop-shadow` trick or overlay shapes)

## Labels

- Territory name: centered or positioned per territory
- Army count: overlay on territory; bold, readable
- Font: System font or web-safe; ensure legibility at small sizes

## Responsive

- `viewBox` preserves aspect ratio; `width="100%" height="auto"` for responsive scaling
- Touch: use `touch-action: none` on map container to prevent scroll/zoom conflicts; implement pinch-zoom if desired

## State Binding

- `territories[].ownerId` → fill color from `players[].color`
- `territories[].armyCount` → label text
- Selected territory: store `selectedTerritoryId` in Zustand; highlight in SVG

## References

- [006-map-format](../006-map-format/spec.md) — Map definition
- [020-client-state-zustand](../020-client-state-zustand/spec.md) — State for rendering
