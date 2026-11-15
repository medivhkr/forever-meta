import type { EncounterData, Metric, PlayerParse, Role, SpecStats, StatKey, ZoneData } from './types.ts';
import { specInfo } from './specs.ts';

// Как считается тир-лист:
// 1. На каждом боссе берём выбранную метрику спека (по умолчанию медиану 100 лучших парсов).
// 2. Делим на значение лучшего спека этой роли на том же боссе — получаем долю от 0 до 1.
// 3. Усредняем доли по всем боссам рейда. Это и есть оценка спека.
// 4. Раскладываем по тирам. Цвета — привычная шкала тир-листов: S красный, A оранжевый, B жёлтый, C зелёный, D синий.

export type TierId = 'S' | 'A' | 'B' | 'C' | 'D';

export const TIERS: { id: TierId; min: number; label: string; color: string }[] = [
  { id: 'S', min: 0.97, label: 'лучший', color: 'var(--tier-s)' },
  { id: 'A', min: 0.92, label: 'сильный', color: 'var(--tier-a)' },
  { id: 'B', min: 0.85, label: 'выше среднего', color: 'var(--tier-b)' },
  { id: 'C', min: 0.75, label: 'средний', color: 'var(--tier-c)' },
  { id: 'D', min: 0, label: 'слабый', color: 'var(--tier-d)' },
];

// Спек с меньшим числом парсов на боссе в расчёт не берём: слишком шумно.
export const MIN_PARSES = 10;

export function tierFor(score: number): TierId {
  return (TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]).id;
}

export interface EncounterRow {
  stats: SpecStats;
  value: number;
  rel: number;
  rank: number;
}

export function rankEncounter(enc: EncounterData, role: Role, stat: StatKey): EncounterRow[] {
  const rows = enc.specs
    .filter((s) => s.count >= MIN_PARSES && specInfo(s.cls, s.spec, s.metric).role === role)
    .map((s) => ({ stats: s, value: s[stat] }))
    .sort((a, b) => b.value - a.value);
  const best = rows[0]?.value ?? 0;
  return rows.map((row, i) => ({ ...row, rel: best > 0 ? row.value / best : 0, rank: i + 1 }));
}

export interface SpecScore {
  cls: string;
  spec: string;
  metric: Metric;
  score: number;
  bosses: number;
  sparse: boolean;
  tier: TierId;
  perBoss: Record<number, EncounterRow | undefined>;
}

export function scoreZone(zone: ZoneData, role: Role, stat: StatKey): SpecScore[] {
  const byKey = new Map<string, { item: SpecScore; sum: number }>();
  for (const enc of zone.encounters) {
    for (const row of rankEncounter(enc, role, stat)) {
      const key = `${row.stats.cls}/${row.stats.spec}`;
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          item: {
            cls: row.stats.cls,
            spec: row.stats.spec,
            metric: row.stats.metric,
            score: 0,
            bosses: 0,
            sparse: false,
            tier: 'D',
            perBoss: {},
          },
          sum: 0,
        };
        byKey.set(key, entry);
      }
      entry.item.perBoss[enc.id] = row;
      entry.item.bosses += 1;
      entry.sum += row.rel;
    }
  }

  // Спек, который встречается меньше чем на половине боссов, помечаем «мало данных».
  const half = Math.ceil(zone.encounters.length / 2);
  return [...byKey.values()]
    .map(({ item, sum }) => {
      const score = item.bosses ? sum / item.bosses : 0;
      return { ...item, score, sparse: item.bosses < half, tier: tierFor(score) };
    })
    .sort((a, b) => Number(a.sparse) - Number(b.sparse) || b.score - a.score);
}

export interface PlayerRow extends PlayerParse {
  cls: string;
  spec: string;
  metric: Metric;
}

export function topPlayers(enc: EncounterData, role: Role, limit = 25): PlayerRow[] {
  return enc.specs
    .filter((s) => specInfo(s.cls, s.spec, s.metric).role === role)
    .flatMap((s) => s.players.map((p) => ({ ...p, cls: s.cls, spec: s.spec, metric: s.metric })))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
