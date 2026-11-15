import type { Character, GearSlot, Item, ItemSlot } from './types.ts';

// Справочники для предметов и персонажей: подписи слотов, характеристик, рас.

export const QUALITY_LABEL = ['Низкое', 'Обычное', 'Необычное', 'Редкое', 'Эпическое', 'Легендарное'];

export const GEAR_LEFT: GearSlot[] = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist'];
export const GEAR_RIGHT: GearSlot[] = ['hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'];
export const GEAR_WEAPONS: GearSlot[] = ['mainhand', 'offhand', 'ranged'];
export const GEAR_ALL: GearSlot[] = [...GEAR_LEFT, ...GEAR_RIGHT, ...GEAR_WEAPONS];

export const GEAR_LABEL: Record<GearSlot, string> = {
  head: 'Голова',
  neck: 'Шея',
  shoulder: 'Плечи',
  back: 'Спина',
  chest: 'Грудь',
  wrist: 'Запястья',
  hands: 'Кисти рук',
  waist: 'Пояс',
  legs: 'Ноги',
  feet: 'Ступни',
  finger1: 'Палец',
  finger2: 'Палец',
  trinket1: 'Аксессуар',
  trinket2: 'Аксессуар',
  mainhand: 'Правая рука',
  offhand: 'Левая рука',
  ranged: 'Дальний бой',
};

export const SLOT_LABEL: Record<ItemSlot, string> = {
  head: 'Голова',
  neck: 'Шея',
  shoulder: 'Плечи',
  back: 'Спина',
  chest: 'Грудь',
  wrist: 'Запястья',
  hands: 'Кисти рук',
  waist: 'Пояс',
  legs: 'Ноги',
  feet: 'Ступни',
  finger: 'Кольцо',
  trinket: 'Аксессуар',
  mainhand: 'Правая рука',
  onehand: 'Одноручное',
  offhand: 'Левая рука',
  holdable: 'Левая рука (не оружие)',
  twohand: 'Двуручное',
  ranged: 'Дальний бой',
  relic: 'Реликвия',
};

// Тип брони, который класс носит на 70-м уровне
export const CLASS_ARMOR: Record<string, string> = {
  warrior: 'Plate',
  paladin: 'Plate',
  hunter: 'Mail',
  shaman: 'Mail',
  rogue: 'Leather',
  druid: 'Leather',
  priest: 'Cloth',
  mage: 'Cloth',
  warlock: 'Cloth',
};

// Слоты, где важен тип брони
export const ARMOR_SLOTS = new Set<GearSlot>(['head', 'shoulder', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet']);

export const ARMOR_TYPES: { value: string; label: string }[] = [
  { value: 'Cloth', label: 'Ткань' },
  { value: 'Leather', label: 'Кожа' },
  { value: 'Mail', label: 'Кольчуга' },
  { value: 'Plate', label: 'Латы' },
];

export const STAT_LABEL: Record<string, string> = {
  sta: 'Выносливость',
  int: 'Интеллект',
  spi: 'Дух',
  agi: 'Ловкость',
  str: 'Сила',
  sp: 'Сила заклинаний',
  heal: 'Исцеление',
  ap: 'Сила атаки',
  rap: 'Сила атаки дальнего боя',
  feralap: 'Сила атаки в формах',
  hit: 'Рейтинг меткости',
  spellhit: 'Меткость заклинаний',
  crit: 'Рейтинг крит. удара',
  spellcrit: 'Крит. удар заклинаний',
  haste: 'Рейтинг скорости',
  spellhaste: 'Скорость заклинаний',
  def: 'Рейтинг защиты',
  dodge: 'Рейтинг уклонения',
  parry: 'Рейтинг парирования',
  block: 'Рейтинг блока',
  blockval: 'Показатель блока',
  mp5: 'Маны раз в 5 сек.',
  exp: 'Рейтинг мастерства',
  arp: 'Пробивание брони',
  spen: 'Проникающая способность',
  resil: 'Устойчивость',
};

// Короткие подписи для бейджей в списке предметов
export const STAT_SHORT: Record<string, string> = {
  sp: 'СЗ',
  heal: 'исцел.',
  ap: 'СА',
  rap: 'СА д/б',
  feralap: 'СА в формах',
  hit: 'метк.',
  spellhit: 'метк. закл.',
  crit: 'крит',
  spellcrit: 'крит закл.',
  haste: 'скор.',
  spellhaste: 'скор. закл.',
  def: 'защ.',
  dodge: 'уклон.',
  parry: 'парир.',
  block: 'блок',
  mp5: 'мп5',
  exp: 'мастерство',
  arp: 'проб. брони',
  agi: 'ловк.',
  str: 'сила',
  int: 'инт.',
  sta: 'вын.',
  spi: 'дух',
};

export const RACE_LABEL: Record<string, string> = {
  human: 'Человек',
  dwarf: 'Дворф',
  nightelf: 'Ночной эльф',
  gnome: 'Гном',
  draenei: 'Дреней',
  orc: 'Орк',
  undead: 'Нежить',
  tauren: 'Таурен',
  troll: 'Тролль',
  bloodelf: 'Эльф крови',
};

export const FACTION_LABEL = { alliance: 'Альянс', horde: 'Орда' } as const;

export type Focus = 'caster' | 'healer' | 'agi' | 'str' | 'tank' | 'other';

export const FOCUS_LABEL: Record<Focus, string> = {
  caster: 'Заклинатели',
  healer: 'Лекари',
  agi: 'Ловкость',
  str: 'Сила',
  tank: 'Танки',
  other: 'Прочее',
};

const s = (item: Item, key: string) => item.stats[key] ?? 0;

// Для кого вещь: определяем по характеристикам
export function itemFocus(item: Item): Focus {
  const tank = s(item, 'def') + s(item, 'dodge') + s(item, 'parry') + s(item, 'block') + s(item, 'blockval');
  const heal = s(item, 'heal') + s(item, 'mp5');
  const caster = s(item, 'sp') + s(item, 'spellhit') + s(item, 'spellcrit') + s(item, 'spellhaste');
  if (tank > 0) return 'tank';
  if (heal > 0 && s(item, 'heal') >= s(item, 'sp')) return 'healer';
  if (caster > 0) return 'caster';
  if (s(item, 'str') > s(item, 'agi')) return 'str';
  if (s(item, 'agi') + s(item, 'ap') + s(item, 'rap') + s(item, 'feralap') + s(item, 'hit') + s(item, 'crit') > 0) return 'agi';
  return 'other';
}

// Самые заметные «зелёные» характеристики вещи для бейджей
export function keyStats(item: Item, limit = 3): { key: string; value: number }[] {
  const order = ['sp', 'heal', 'ap', 'rap', 'feralap', 'spellcrit', 'spellhit', 'spellhaste', 'crit', 'hit', 'haste', 'def', 'dodge', 'parry', 'block', 'mp5', 'exp', 'arp', 'agi', 'str', 'int'];
  return order
    .filter((key) => s(item, key) > 0)
    .slice(0, limit)
    .map((key) => ({ key, value: s(item, key) }));
}

export function sumStats(items: (Item | undefined)[]): Record<string, number> {
  const total: Record<string, number> = {};
  for (const item of items) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item.stats)) total[key] = (total[key] ?? 0) + (value ?? 0);
    if (item.armor) total.armor = (total.armor ?? 0) + item.armor;
  }
  return total;
}

// Какие характеристики показывать в сводке персонажа в зависимости от роли
export const ROLE_STATS: Record<string, string[]> = {
  caster: ['sp', 'spellcrit', 'spellhit', 'spellhaste', 'int', 'spi', 'sta'],
  healer: ['heal', 'mp5', 'int', 'spi', 'spellcrit', 'sp', 'sta'],
  agi: ['agi', 'ap', 'crit', 'hit', 'haste', 'exp', 'sta'],
  str: ['str', 'ap', 'crit', 'hit', 'haste', 'exp', 'sta'],
  tank: ['sta', 'def', 'dodge', 'parry', 'block', 'agi', 'armor'],
};

const CASTERS = new Set(['priest/shadow', 'shaman/elemental', 'mage/arcane', 'mage/fire', 'mage/frost', 'warlock/affliction', 'warlock/demonology', 'warlock/destruction', 'druid/balance']);
const HEALERS = new Set(['paladin/holy', 'priest/discipline', 'priest/holy', 'shaman/restoration', 'druid/restoration']);
const TANKS = new Set(['warrior/protection', 'paladin/protection', 'druid/guardian']);
const STRENGTH = new Set(['warrior/arms', 'warrior/fury', 'paladin/retribution']);

export function characterFocus(c: Pick<Character, 'cls' | 'spec'>): Exclude<Focus, 'other'> {
  const key = `${c.cls}/${c.spec}`;
  if (CASTERS.has(key)) return 'caster';
  if (HEALERS.has(key)) return 'healer';
  if (TANKS.has(key)) return 'tank';
  if (STRENGTH.has(key)) return 'str';
  return 'agi';
}

// Имена боссов у Warcraft Logs и AtlasLoot чуть различаются: сравниваем без артиклей и знаков
export function bossKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the /, '')
    .replace(/[^a-zа-яё0-9]+/gi, '');
}

export function wowheadUrl(id: number): string {
  return `https://www.wowhead.com/tbc/ru/item=${id}`;
}
