import { GEAR_ALL } from '../data/items.ts';
import type { GearSlot, Item } from '../data/types.ts';

// Логика конструктора экипировки: чистые функции без React, поэтому их легко тестировать.

export type Gear = Record<GearSlot, number | null>;

export interface PlanState {
  cls: string;
  spec: string;
  gear: Gear;
  baseId: string | null; // с кем сравниваем: id демо-персонажа
}

export type PlanAction =
  | { type: 'spec'; cls: string; spec: string }
  | { type: 'equip'; slot: GearSlot; item: Item }
  | { type: 'unequip'; slot: GearSlot }
  | { type: 'compare'; baseId: string | null }
  | { type: 'load'; state: PlanState }
  | { type: 'clear' };

export function emptyGear(): Gear {
  return Object.fromEntries(GEAR_ALL.map((slot) => [slot, null])) as Gear;
}

export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'spec':
      return { ...state, cls: action.cls, spec: action.spec };
    case 'equip': {
      const gear = { ...state.gear, [action.slot]: action.item.id };
      // Двуручное оружие занимает обе руки
      if (action.slot === 'mainhand' && action.item.slot === 'twohand') gear.offhand = null;
      return { ...state, gear };
    }
    case 'unequip':
      return { ...state, gear: { ...state.gear, [action.slot]: null } };
    case 'compare':
      return { ...state, baseId: action.baseId };
    case 'load':
      return { ...action.state, gear: { ...action.state.gear } };
    case 'clear':
      return { ...state, gear: emptyGear() };
  }
}

// Какие предметы подходят в слот персонажа
export function fitsSlot(item: Item, slot: GearSlot): boolean {
  switch (slot) {
    case 'finger1':
    case 'finger2':
      return item.slot === 'finger';
    case 'trinket1':
    case 'trinket2':
      return item.slot === 'trinket';
    case 'mainhand':
      return item.slot === 'mainhand' || item.slot === 'onehand' || item.slot === 'twohand';
    case 'offhand':
      return item.slot === 'offhand' || item.slot === 'onehand' || item.slot === 'holdable';
    case 'ranged':
      return item.slot === 'ranged' || item.slot === 'relic';
    default:
      return item.slot === slot;
  }
}

// Сборка помещается в адрес: ?spec=mage/fire&g=32235-32260--30210…
// 17 слотов в фиксированном порядке, пустой слот — пустая строка. Дефис не кодируется в URL.
export function encodePlan(state: PlanState): string {
  const params = new URLSearchParams();
  params.set('spec', `${state.cls}/${state.spec}`);
  params.set('g', GEAR_ALL.map((slot) => state.gear[slot] ?? '').join('-'));
  if (state.baseId) params.set('vs', state.baseId);
  return params.toString();
}

export function decodePlan(params: URLSearchParams, isKnownItem: (id: number) => boolean): PlanState | null {
  const spec = params.get('spec');
  const raw = params.get('g');
  if (!spec || raw === null) return null;
  const [cls, specName] = spec.split('/');
  if (!cls || !specName) return null;
  const ids = raw.split('-');
  const gear = emptyGear();
  GEAR_ALL.forEach((slot, i) => {
    const id = Number(ids[i]);
    gear[slot] = ids[i] && Number.isInteger(id) && isKnownItem(id) ? id : null;
  });
  return { cls, spec: specName, gear, baseId: params.get('vs') };
}

// Разница характеристик сборки и того, с чем сравниваем
export function statDelta(current: Record<string, number>, base: Record<string, number>): Record<string, number> {
  const keys = new Set([...Object.keys(current), ...Object.keys(base)]);
  const delta: Record<string, number> = {};
  for (const key of keys) delta[key] = (current[key] ?? 0) - (base[key] ?? 0);
  return delta;
}
