// Форма данных, которую пишет scripts/collect.ts и читает сайт.

export type Role = 'dps' | 'heal' | 'tank';
export type StatKey = 'median' | 'top10' | 'max';
export type Metric = 'dps' | 'hps';

export interface EncounterRef {
  id: number;
  name: string;
}

export interface ZoneRef {
  id: number;
  name: string;
  encounters: EncounterRef[];
}

export interface Meta {
  generatedAt: string;
  demo: boolean;
  partial: boolean;
  site: string;
  gameVersion: string;
  topN: number;
  zones: ZoneRef[];
}

export interface PlayerParse {
  name: string;
  server: string;
  region: string;
  guild: string | null;
  amount: number;
  duration: number | null;
  date: number | null;
  report: string | null;
  fight: number | null;
  charId?: string;
}

// ---------- база предметов (public/data/items.json) ----------

export type ItemSlot =
  | 'head' | 'neck' | 'shoulder' | 'back' | 'chest' | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'finger' | 'trinket' | 'mainhand' | 'onehand' | 'offhand' | 'holdable' | 'twohand' | 'ranged' | 'relic';

export interface Item {
  id: number;
  name: string;
  nameEn: string;
  q: number;
  icon: string;
  ilvl: number;
  phase: number | null;
  slot: ItemSlot;
  slotRu: string;
  type: string | null;
  typeRu: string | null;
  armor?: number;
  dmg?: [number, number];
  speed?: number;
  dps?: number;
  stats: Partial<Record<string, number>>;
  statLines: string[];
  sockets?: string[];
  socketsRu?: string[];
  socketBonus?: string;
  effects?: string[];
  set?: { name: string; size: number; bonuses: string[] };
  classes?: string;
  bind: string | null;
  unique: boolean;
  zone: number;
  boss: string;
}

export interface ItemsDb {
  generatedAt: string;
  sources: string[];
  zones: { id: number; name: string; bosses: { name: string; items: number[] }[] }[];
  items: Item[];
}

// ---------- демо-персонажи (public/data/characters.json) ----------

export type GearSlot =
  | 'head' | 'neck' | 'shoulder' | 'back' | 'chest' | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'finger1' | 'finger2' | 'trinket1' | 'trinket2' | 'mainhand' | 'offhand' | 'ranged';

export interface CharacterParse {
  z: number; // id рейда
  e: number; // id босса
  a: number; // DPS или HPS
  r: number; // место среди игроков той же роли
  n: number; // всего игроков этой роли на боссе
}

export interface Character {
  id: string;
  name: string;
  realm: string;
  region: string;
  faction: 'alliance' | 'horde';
  race: string;
  cls: string;
  spec: string;
  guild: string;
  level: number;
  skill: number;
  ilvl: number;
  gear: Record<GearSlot, number | null>;
  parses: CharacterParse[];
}

export interface CharactersDb {
  generatedAt: string;
  demo: boolean;
  characters: Character[];
}

export interface SpecStats {
  cls: string;
  spec: string;
  metric: Metric;
  count: number;
  max: number;
  top10: number;
  median: number;
  players: PlayerParse[];
}

export interface EncounterData {
  id: number;
  name: string;
  specs: SpecStats[];
}

export interface ZoneData {
  id: number;
  name: string;
  encounters: EncounterData[];
}
