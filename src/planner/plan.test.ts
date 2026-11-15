import { describe, expect, it } from 'vitest';
import type { Item, ItemSlot } from '../data/types.ts';
import { decodePlan, emptyGear, encodePlan, fitsSlot, planReducer, statDelta, type PlanState } from './plan.ts';

const item = (id: number, slot: ItemSlot): Item => ({
  id,
  name: `Предмет ${id}`,
  nameEn: `Item ${id}`,
  q: 4,
  icon: 'inv_misc_questionmark',
  ilvl: 141,
  phase: 3,
  slot,
  slotRu: '',
  type: null,
  typeRu: null,
  stats: {},
  statLines: [],
  bind: null,
  unique: false,
  zone: 3959,
  boss: 'Supremus',
});

const start: PlanState = { cls: 'warrior', spec: 'arms', gear: emptyGear(), baseId: null };

describe('planReducer', () => {
  it('двуручное оружие снимает предмет с левой руки', () => {
    let state = planReducer(start, { type: 'equip', slot: 'offhand', item: item(2, 'offhand') });
    expect(state.gear.offhand).toBe(2);
    state = planReducer(state, { type: 'equip', slot: 'mainhand', item: item(1, 'twohand') });
    expect(state.gear.mainhand).toBe(1);
    expect(state.gear.offhand).toBeNull();
  });

  it('не мутирует прежнее состояние', () => {
    const next = planReducer(start, { type: 'equip', slot: 'head', item: item(5, 'head') });
    expect(start.gear.head).toBeNull();
    expect(next).not.toBe(start);
    expect(next.gear.head).toBe(5);
  });
});

describe('fitsSlot', () => {
  it('кольца подходят в оба слота, одноручное оружие — в обе руки, двуручное — только в правую', () => {
    expect(fitsSlot(item(1, 'finger'), 'finger2')).toBe(true);
    expect(fitsSlot(item(1, 'onehand'), 'offhand')).toBe(true);
    expect(fitsSlot(item(1, 'twohand'), 'mainhand')).toBe(true);
    expect(fitsSlot(item(1, 'twohand'), 'offhand')).toBe(false);
  });
});

describe('сборка в адресе страницы', () => {
  it('переживает поездку туда и обратно', () => {
    const state: PlanState = { ...start, gear: { ...emptyGear(), head: 32235, ranged: 32336 }, baseId: 'nerith-nightslayer' };
    expect(decodePlan(new URLSearchParams(encodePlan(state)), () => true)).toEqual(state);
  });

  it('выбрасывает предметы, которых нет в базе', () => {
    const state: PlanState = { ...start, gear: { ...emptyGear(), head: 1, neck: 2 } };
    const back = decodePlan(new URLSearchParams(encodePlan(state)), (id) => id === 1);
    expect(back?.gear.head).toBe(1);
    expect(back?.gear.neck).toBeNull();
  });
});

describe('statDelta', () => {
  it('считает разницу по всем характеристикам', () => {
    expect(statDelta({ sp: 10, int: 5 }, { sp: 4, sta: 3 })).toEqual({ sp: 6, int: 5, sta: -3 });
  });
});
