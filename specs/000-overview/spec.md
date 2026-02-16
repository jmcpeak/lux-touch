# 000 - Overview

Goals, non-goals, glossary, and MVP ruleset for the Lux Touch web clone.

## Goals

- **Web-based Lux Touch clone:** A Risk-style world conquest game playable in the browser
- **Mobile-friendly:** Touch-optimized UI that works on phones, tablets, and desktops
- **Single-player vs AI:** Human player vs 1–5 computer opponents with configurable difficulty
- **Optional auth:** Anonymous play supported; Auth.js enables game saves and future leaderboards
- **Classic map:** 42-territory world map with 6 continents (North America, South America, Europe, Africa, Asia, Australia)

## Non-Goals (MVP)

- **Real-time multiplayer:** Async or live multiplayer is phase 2
- **Lux DLX premium features:** Hot-seat multiplayer, game saves (beyond basic persistence), multiple maps
- **Ranking/leaderboard system:** Deferred to post-MVP
- **Chat:** Not in scope for MVP

## Glossary

| Term | Definition |
|------|------------|
| **Territory** | A single region on the map; has an owner, army count, and adjacent territories |
| **Continent** | A group of territories; controlling all territories in a continent grants a bonus at turn start |
| **Reinforcement** | Armies received at the start of a turn (territories/3, continent bonuses, card trade-ins) |
| **Fortify** | Moving armies from one friendly territory to an adjacent friendly territory (one move per turn) |
| **Card set** | Three cards traded for armies: 3-of-a-kind, 1-of-each symbol, or 2 + wild |
| **Phase** | Turn phase: `REINFORCE` → `ATTACK` → `FORTIFY` → next player |
| **Capture** | Conquering an enemy territory; attacker must move in ≥ dice used |
| **Elimination** | Removing a player from the game; their cards go to the eliminator |

## MVP Ruleset Summary

### Core Loop

1. **Reinforce:** Place new armies (territories/3 min 3, continent bonuses, optional card trade-ins)
2. **Attack:** Unlimited attacks from territories with 2+ armies; dice combat
3. **Fortify:** One move of armies between adjacent friendly territories
4. **End turn:** Pass to next living player

### Reinforcement

- `floor(territories / 3)` armies per turn, minimum 3
- Continent bonus: control all territories in a continent → extra armies (see map format)
- Card trade-in: 3-of-a-kind or 1-of-each for escalating armies (4, 6, 8, 10, 12, 15, 20...)
- Mandatory trade when holding 5+ cards

### Combat

- Attacker: 1–3 dice (must have armies to match)
- Defender: 1–2 dice
- Compare highest vs highest; defender wins ties; loser removes 1 army per comparison
- Attacker needs 2+ armies to attack; must leave 1 behind

### Cards

- Earn 1 card per turn if you conquer ≥1 enemy territory
- Eliminate a player → receive all their cards
- Trade sets at turn start for bonus armies

### Win Condition

- Eliminate all other players

## References

- [001-action-contract](../001-action-contract/spec.md) — Action types and validation
- [004-combat-rules](../004-combat-rules/spec.md) — Dice combat details
- [005-game-state](../005-game-state/spec.md) — State shape and phase machine
- [006-map-format](../006-map-format/spec.md) — Map JSON structure
