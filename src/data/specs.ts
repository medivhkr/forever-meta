import type { Metric, Role, StatKey } from './types.ts';

// Справочник классов и спеков: русские названия как в клиенте игры,
// цвета классов и имена иконок из игровых файлов.

interface ClassMeta {
  name: string;
  color: string;
  icon: string;
}

interface SpecMeta {
  name: string;
  role: Role;
  icon: string;
}

const CLASSES: Record<string, ClassMeta | undefined> = {
  warrior: { name: 'Воин', color: '#C69B6D', icon: 'classicon_warrior' },
  paladin: { name: 'Паладин', color: '#F48CBA', icon: 'classicon_paladin' },
  hunter: { name: 'Охотник', color: '#AAD372', icon: 'classicon_hunter' },
  rogue: { name: 'Разбойник', color: '#FFF468', icon: 'classicon_rogue' },
  priest: { name: 'Жрец', color: '#FFFFFF', icon: 'classicon_priest' },
  shaman: { name: 'Шаман', color: '#0070DD', icon: 'classicon_shaman' },
  mage: { name: 'Маг', color: '#3FC7EB', icon: 'classicon_mage' },
  warlock: { name: 'Чернокнижник', color: '#8788EE', icon: 'classicon_warlock' },
  druid: { name: 'Друид', color: '#FF7C0A', icon: 'classicon_druid' },
};

const SPECS: Record<string, SpecMeta | undefined> = {
  'warrior/arms': { name: 'Оружие', role: 'dps', icon: 'ability_warrior_savageblow' },
  'warrior/fury': { name: 'Неистовство', role: 'dps', icon: 'ability_warrior_innerrage' },
  'warrior/protection': { name: 'Защита', role: 'tank', icon: 'ability_warrior_defensivestance' },
  'paladin/holy': { name: 'Свет', role: 'heal', icon: 'spell_holy_holybolt' },
  'paladin/protection': { name: 'Защита', role: 'tank', icon: 'spell_holy_devotionaura' },
  'paladin/retribution': { name: 'Воздаяние', role: 'dps', icon: 'spell_holy_auraoflight' },
  'hunter/beastmastery': { name: 'Повелитель зверей', role: 'dps', icon: 'ability_hunter_beasttaming' },
  'hunter/marksmanship': { name: 'Стрельба', role: 'dps', icon: 'ability_marksmanship' },
  'hunter/survival': { name: 'Выживание', role: 'dps', icon: 'ability_hunter_swiftstrike' },
  'rogue/assassination': { name: 'Ликвидация', role: 'dps', icon: 'ability_rogue_eviscerate' },
  'rogue/combat': { name: 'Бой', role: 'dps', icon: 'ability_backstab' },
  'rogue/subtlety': { name: 'Скрытность', role: 'dps', icon: 'ability_stealth' },
  'priest/discipline': { name: 'Послушание', role: 'heal', icon: 'spell_holy_wordfortitude' },
  'priest/holy': { name: 'Свет', role: 'heal', icon: 'spell_holy_guardianspirit' },
  'priest/shadow': { name: 'Тьма', role: 'dps', icon: 'spell_shadow_shadowwordpain' },
  'shaman/elemental': { name: 'Стихии', role: 'dps', icon: 'spell_nature_lightning' },
  'shaman/enhancement': { name: 'Совершенствование', role: 'dps', icon: 'spell_nature_lightningshield' },
  'shaman/restoration': { name: 'Исцеление', role: 'heal', icon: 'spell_nature_magicimmunity' },
  'mage/arcane': { name: 'Тайная магия', role: 'dps', icon: 'spell_holy_magicalsentry' },
  'mage/fire': { name: 'Огонь', role: 'dps', icon: 'spell_fire_firebolt02' },
  'mage/frost': { name: 'Лёд', role: 'dps', icon: 'spell_frost_frostbolt02' },
  'warlock/affliction': { name: 'Колдовство', role: 'dps', icon: 'spell_shadow_deathcoil' },
  'warlock/demonology': { name: 'Демонология', role: 'dps', icon: 'spell_shadow_metamorphosis' },
  'warlock/destruction': { name: 'Разрушение', role: 'dps', icon: 'spell_shadow_rainoffire' },
  'druid/balance': { name: 'Баланс', role: 'dps', icon: 'spell_nature_starfall' },
  'druid/feral': { name: 'Сила зверя', role: 'dps', icon: 'ability_druid_catform' },
  'druid/guardian': { name: 'Страж', role: 'tank', icon: 'ability_racial_bearform' },
  'druid/restoration': { name: 'Исцеление', role: 'heal', icon: 'spell_nature_healingtouch' },
};

export interface SpecInfo {
  key: string;
  cls: string;
  spec: string;
  name: string;
  clsName: string;
  color: string;
  icon: string;
  role: Role;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function specInfo(cls: string, spec: string, metric?: Metric): SpecInfo {
  const key = `${cls}/${spec}`;
  const c = CLASSES[cls];
  const s = SPECS[key];
  return {
    key,
    cls,
    spec,
    name: s?.name ?? capitalize(spec),
    clsName: c?.name ?? capitalize(cls),
    color: c?.color ?? '#C8C3B8',
    icon: s?.icon ?? c?.icon ?? 'inv_misc_questionmark',
    role: s?.role ?? (metric === 'hps' ? 'heal' : 'dps'),
  };
}

// Сначала CDN Blizzard, если картинка не загрузилась — зеркало Wowhead.
export function iconUrls(icon: string): string[] {
  return [
    `https://render.worldofwarcraft.com/us/icons/56/${icon}.jpg`,
    `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`,
  ];
}

export const ROLES: Role[] = ['dps', 'heal', 'tank'];
export const ROLE_LABEL: Record<Role, string> = { dps: 'Урон', heal: 'Лечение', tank: 'Танки' };

export const STATS: StatKey[] = ['median', 'top10', 'max'];
export const STAT_LABEL: Record<StatKey, { short: string; long: string }> = {
  median: { short: 'Медиана топ-100', long: 'Медиана 100 лучших парсов' },
  top10: { short: 'Лучшие 10', long: 'Среднее 10 лучших парсов' },
  max: { short: 'Рекорд', long: 'Лучший парс' },
};

// Русские названия рейдов. Warcraft Logs иногда объединяет два рейда в одну зону: «Gruul / Magtheridon».
const ZONES_RU: { re: RegExp; full: string; short: string }[] = [
  { re: /karazhan/i, full: 'Каражан', short: 'Каражан' },
  { re: /gruul/i, full: 'Логово Груула', short: 'Груул' },
  { re: /magtheridon/i, full: 'Логово Магтеридона', short: 'Магтеридон' },
  { re: /serpentshrine/i, full: 'Змеиное святилище', short: 'Змеиное святилище' },
  { re: /tempest keep|the eye/i, full: 'Крепость Бурь', short: 'Крепость Бурь' },
  { re: /black temple/i, full: 'Черный храм', short: 'Черный храм' },
  { re: /hyjal/i, full: 'Битва за гору Хиджал', short: 'Хиджал' },
  { re: /zul'?aman/i, full: "Зул'Аман", short: "Зул'Аман" },
  { re: /sunwell/i, full: 'Плато Солнечного Колодца', short: 'Солнечный Колодец' },
  { re: /onyxia/i, full: 'Логово Ониксии', short: 'Ониксия' },
];

export function zoneTitle(name: string): { ru: string; en: string } {
  const parts = name.split(/\s*\/\s*/).filter(Boolean);
  const names = parts.map((part) => {
    const hit = ZONES_RU.find((z) => z.re.test(part));
    if (!hit) return part;
    return parts.length > 1 ? hit.short : hit.full;
  });
  return { ru: names.join(' и '), en: name };
}
