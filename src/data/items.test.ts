import { describe, expect, it } from 'vitest';
import { bossKey, itemFocus, sumStats } from './items.ts';
import type { Item } from './types.ts';

const item = (stats: Item['stats'], extra: Partial<Item> = {}): Item => ({
  id: 1,
  name: 'Предмет',
  nameEn: 'Item',
  q: 4,
  icon: 'inv_misc_questionmark',
  ilvl: 141,
  phase: 3,
  slot: 'head',
  slotRu: 'Голова',
  type: 'Cloth',
  typeRu: 'Ткань',
  stats,
  statLines: [],
  bind: null,
  unique: false,
  zone: 3959,
  boss: 'Supremus',
  ...extra,
});

describe('itemFocus', () => {
  it('по характеристикам понимает, для кого вещь', () => {
    expect(itemFocus(item({ int: 20, sp: 40 }))).toBe('caster');
    expect(itemFocus(item({ int: 20, heal: 80, mp5: 6 }))).toBe('healer');
    expect(itemFocus(item({ sta: 40, def: 20 }))).toBe('tank');
    expect(itemFocus(item({ agi: 30, ap: 40 }))).toBe('agi');
    expect(itemFocus(item({ str: 30, crit: 20 }))).toBe('str');
  });
});

describe('sumStats', () => {
  it('складывает характеристики и броню, пропуская пустые слоты', () => {
    const total = sumStats([item({ sta: 10, sp: 5 }, { armor: 100 }), undefined, item({ sta: 7 }, { armor: 50 })]);
    expect(total).toEqual({ sta: 17, sp: 5, armor: 150 });
  });
});

describe('bossKey', () => {
  it('сравнивает имена боссов без артикля и знаков', () => {
    expect(bossKey('The Lurker Below')).toBe(bossKey('Lurker Below'));
    expect(bossKey("Kael'thas Sunstrider")).toBe('kaelthassunstrider');
  });
});
