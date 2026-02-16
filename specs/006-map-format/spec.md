# 006 - Map Format

42-territory JSON format: territories, adjacencies, continents, and bonuses.

## Schema

```typescript
interface MapDefinition {
  id: string;
  name: string;
  territories: TerritoryDefinition[];
  continents: ContinentDefinition[];
}

interface TerritoryDefinition {
  id: string;
  name: string;
  continentId: string;
  adjacencies: string[]; // Territory IDs
}

interface ContinentDefinition {
  id: string;
  name: string;
  bonus: number;
}
```

## Classic Risk Map (42 Territories)

### Continents

| ID | Name | Bonus | Territory Count |
|----|------|-------|-----------------|
| na | North America | 5 | 9 |
| sa | South America | 2 | 4 |
| eu | Europe | 5 | 7 |
| af | Africa | 3 | 6 |
| as | Asia | 7 | 12 |
| au | Australia | 2 | 4 |

### Territories (by Continent)

**North America (na):** Alaska, Northwest Territory, Greenland, Alberta, Ontario, Quebec, Western United States, Eastern United States, Central America

**South America (sa):** Venezuela, Peru, Brazil, Argentina

**Europe (eu):** Iceland, Great Britain, Scandinavia, Northern Europe, Southern Europe, Ukraine, Western Europe

**Africa (af):** North Africa, Egypt, East Africa, Congo, South Africa, Madagascar

**Asia (as):** Middle East, Afghanistan, Ural, Siberia, Yakutsk, Kamchatka, Irkutsk, Mongolia, Japan, China, India, Southeast Asia

**Australia (au):** Indonesia, New Guinea, Eastern Australia, Western Australia

### Adjacencies (Examples)

- Alaska ↔ Northwest Territory, Alberta, Kamchatka
- Northwest Territory ↔ Alaska, Greenland, Alberta, Ontario
- Argentina ↔ Peru, Brazil
- Brazil ↔ Venezuela, Peru, Argentina, North Africa
- (Full adjacency graph to be provided in `data/maps/classic.json`)

## JSON Example

```json
{
  "id": "classic",
  "name": "Classic World",
  "territories": [
    {
      "id": "alaska",
      "name": "Alaska",
      "continentId": "na",
      "adjacencies": ["northwest-territory", "alberta", "kamchatka"]
    }
  ],
  "continents": [
    { "id": "na", "name": "North America", "bonus": 5 },
    { "id": "sa", "name": "South America", "bonus": 2 }
  ]
}
```

## Validation

- Every `adjacency` must reference a valid territory ID (bidirectional implied)
- Every territory must belong to exactly one continent
- Territory IDs: kebab-case, unique
- Continent IDs: 2-letter codes or kebab-case

## References

- [005-game-state](../005-game-state/spec.md) — TerritorySnapshot uses territory IDs
- [021-map-rendering](../021-map-rendering/spec.md) — SVG rendering uses this structure
