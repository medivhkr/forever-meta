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
