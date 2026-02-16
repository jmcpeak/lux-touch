// Game state types (spec 005)

export type Phase = 'REINFORCE' | 'ATTACK' | 'FORTIFY';

export type CardSymbol = 'INFANTRY' | 'CAVALRY' | 'ARTILLERY' | 'WILD';

export interface PlayerSnapshot {
  id: string;
  name: string;
  isBot: boolean;
  isEliminated: boolean;
  color: string;
}

export interface TerritorySnapshot {
  id: string;
  ownerId: string | null;
  armyCount: number;
}

export interface CardSnapshot {
  id: string;
  ownerId: string;
  symbol: CardSymbol;
  territoryId?: string;
}

export interface GameStateSnapshot {
  gameId: string;
  revision: number;
  phase: Phase;
  currentPlayerId: string;
  players: PlayerSnapshot[];
  territories: TerritorySnapshot[];
  cards: CardSnapshot[];
  seed: string;
}

// Map types (spec 006)

export interface TerritoryDefinition {
  id: string;
  name: string;
  continentId: string;
  adjacencies: string[];
}

export interface ContinentDefinition {
  id: string;
  name: string;
  bonus: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  territories: TerritoryDefinition[];
  continents: ContinentDefinition[];
}

// Action types (spec 001)

export type ActionType =
  | 'PLACE_ARMIES'
  | 'TRADE_CARDS'
  | 'ATTACK'
  | 'FORTIFY'
  | 'END_TURN';

export interface PlaceArmiesPayload {
  placements: Array<{ territoryId: string; count: number }>;
}

export interface TradeCardsPayload {
  cardIds: [string, string, string];
}

export interface AttackPayload {
  fromTerritoryId: string;
  toTerritoryId: string;
  attackerDice: 1 | 2 | 3;
}

export interface FortifyPayload {
  fromTerritoryId: string;
  toTerritoryId: string;
  count: number;
}

export type ActionPayload =
  | PlaceArmiesPayload
  | TradeCardsPayload
  | AttackPayload
  | FortifyPayload
  | Record<string, never>;

export interface ActionRequest {
  gameId: string;
  action: ActionType;
  payload: ActionPayload;
}
