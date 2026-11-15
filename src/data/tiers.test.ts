import { describe, expect, it } from 'vitest';
import { rankEncounter, scoreZone, tierFor } from './tiers.ts';
import type { EncounterData, SpecStats, ZoneData } from './types.ts';

const spec = (cls: string, name: string, median: number, extra: Partial<SpecStats> = {}): SpecStats => ({
  cls,
  spec: name,
  metric: 'dps',
  count: 100,
  max: median * 1.3,
  top10: median * 1.15,
  median,
  players: [],
  ...extra,
});

describe('tierFor', () => {
  it('раскладывает долю от лучшего спека по тирам', () => {
    expect(tierFor(1)).toBe('S');
    expect(tierFor(0.97)).toBe('S');
    expect(tierFor(0.95)).toBe('A');
    expect(tierFor(0.86)).toBe('B');
    expect(tierFor(0.8)).toBe('C');
    expect(tierFor(0.5)).toBe('D');
  });
});

describe('rankEncounter', () => {
  const encounter: EncounterData = {
    id: 1,
    name: 'Boss',
    specs: [
      spec('mage', 'fire', 1000),
      spec('warlock', 'destruction', 1200),
      spec('priest', 'holy', 900, { metric: 'hps' }),
      spec('rogue', 'combat', 800, { count: 5 }),
    ],
  };

  it('берёт спеки нужной роли, сортирует и считает долю от лучшего', () => {
    const rows = rankEncounter(encounter, 'dps', 'median');
    // лекарь не попал в урон, у разбойника слишком мало парсов
    expect(rows.map((r) => r.stats.spec)).toEqual(['destruction', 'fire']);
    expect(rows[0].rel).toBe(1);
    expect(rows[1].rel).toBeCloseTo(1000 / 1200);
    expect(rows[1].rank).toBe(2);
  });
});

describe('scoreZone', () => {
  const zone: ZoneData = {
    id: 1,
    name: 'Raid',
    encounters: [
      { id: 1, name: 'A', specs: [spec('mage', 'fire', 1000), spec('warlock', 'destruction', 800)] },
      { id: 2, name: 'B', specs: [spec('mage', 'fire', 900), spec('warlock', 'destruction', 1000)] },
      { id: 3, name: 'C', specs: [spec('mage', 'fire', 1000), spec('rogue', 'combat', 1000)] },
    ],
  };

  it('усредняет долю от лучшего по боссам', () => {
    const fire = scoreZone(zone, 'dps', 'median').find((s) => s.spec === 'fire');
    expect(fire?.bosses).toBe(3);
    expect(fire?.score).toBeCloseTo((1 + 0.9 + 1) / 3);
  });

  it('спек, который есть меньше чем на половине боссов, помечается и уходит в конец', () => {
    const scores = scoreZone(zone, 'dps', 'median');
    expect(scores.find((s) => s.spec === 'combat')?.sparse).toBe(true);
    expect(scores.at(-1)?.spec).toBe('combat');
  });
});
