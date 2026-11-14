// База предметов рейдов TBC.
//   node scripts/build-items.ts
//
// 1. Списки добычи по боссам берём из открытого аддона AtlasLoot Classic.
// 2. Сами предметы (название, иконка, характеристики) — из API всплывающих подсказок Wowhead,
//    на английском (для разбора цифр) и на русском (для показа на сайте).
// Результат: public/data/items.json. Скрипт запускается вручную, файл хранится в репозитории.

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ATLASLOOT_URL =
  'https://raw.githubusercontent.com/Hoizame/AtlasLootClassic/master/AtlasLootClassic_DungeonsAndRaids/data-tbc.lua';
const tooltipUrl = (id: number, locale: number) => `https://nether.wowhead.com/tbc/tooltip/item/${id}?locale=${locale}`;
const LOCALE_EN = 0;
const LOCALE_RU = 7;
const OUT = new URL('../public/data/items.json', import.meta.url);
const CACHE_DIR = new URL('./.cache/', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const RAIDS = [
  { key: 'Karazhan', id: 3457, name: 'Karazhan' },
  { key: 'GruulsLair', id: 3923, name: "Gruul's Lair" },
  { key: 'MagtheridonsLair', id: 3836, name: "Magtheridon's Lair" },
  { key: 'SerpentshrineCavern', id: 3607, name: 'Serpentshrine Cavern' },
  { key: 'TempestKeep', id: 3845, name: 'Tempest Keep' },
  { key: 'HyjalSummit', id: 3606, name: 'Hyjal Summit' },
  { key: 'BlackTemple', id: 3959, name: 'Black Temple' },
  { key: 'ZulAman', id: 3805, name: "Zul'Aman" },
];

type SlotKey =
  | 'head' | 'neck' | 'shoulder' | 'back' | 'chest' | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'finger' | 'trinket' | 'mainhand' | 'onehand' | 'offhand' | 'holdable' | 'twohand' | 'ranged' | 'relic';

const SLOTS: Record<string, SlotKey> = {
  Head: 'head', Neck: 'neck', Shoulder: 'shoulder', Back: 'back', Chest: 'chest', Wrist: 'wrist',
  Hands: 'hands', Waist: 'waist', Legs: 'legs', Feet: 'feet', Finger: 'finger', Trinket: 'trinket',
  'Main Hand': 'mainhand', 'One-Hand': 'onehand', 'Off Hand': 'offhand', 'Held In Off-hand': 'holdable',
  'Two-Hand': 'twohand', Ranged: 'ranged', Thrown: 'ranged', Relic: 'relic',
};

type Stats = Partial<Record<string, number>>;

interface Item {
  id: number;
  name: string;
  nameEn: string;
  q: number;
  icon: string;
  ilvl: number;
  phase: number | null;
  slot: SlotKey;
  slotRu: string;
  type: string | null;
  typeRu: string | null;
  armor?: number;
  dmg?: [number, number];
  speed?: number;
  dps?: number;
  stats: Stats;
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function htmlToLines(html: string): string[] {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(table|tr|div|ul|li)\b[^>]*>/gi, '\n')
    .replace(/<\/(table|tr|td|th|div|ul|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/(Classes:|Классы:|Requires |Требуется )/g, '\n$1')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function slotTable(html: string): { slot: string; type: string | null } | null {
  const m = html.match(/<table width="100%"><tr><td>([^<]+)<\/td>(?:<th>([\s\S]*?)<\/th>)?<\/tr><\/table>/);
  if (!m) return null;
  const type = m[2] ? m[2].replace(/<[^>]+>/g, '').trim() : '';
  return { slot: m[1].trim(), type: type || null };
}

// Разбор английской подсказки в числа: на них строятся фильтры и сводка характеристик персонажа.
function parseStats(lines: string[]): { stats: Stats; effects: number } {
  const stats: Stats = {};
  const add = (k: string, v: number) => {
    stats[k] = (stats[k] ?? 0) + v;
  };
  let unparsed = 0;
  const PRIMARY: Record<string, string> = { Stamina: 'sta', Intellect: 'int', Spirit: 'spi', Agility: 'agi', Strength: 'str' };
  for (const line of lines) {
    const prim = line.match(/^\+(\d+) (Stamina|Intellect|Spirit|Agility|Strength)$/);
    if (prim) {
      add(PRIMARY[prim[2]], Number(prim[1]));
      continue;
    }
    const eq = line.match(/^Equip: (.+)$/);
    if (!eq) continue;
    const t = eq[1];
    let m: RegExpMatchArray | null;
    if ((m = t.match(/Increases damage and healing done by magical spells and effects by up to (\d+)/))) add('sp', +m[1]);
    else if ((m = t.match(/Increases healing done by up to (\d+) and damage done by up to (\d+)/))) add('heal', +m[1]);
    else if ((m = t.match(/Increases healing done by spells and effects by up to (\d+)/))) add('heal', +m[1]);
    else if ((m = t.match(/Increases damage done by \w+ spells and effects by up to (\d+)/))) add('sp', +m[1]);
    else if ((m = t.match(/Increases attack power by (\d+) in Cat, Bear, Dire Bear, and Moonkin forms only/))) add('feralap', +m[1]);
    else if ((m = t.match(/Increases ranged attack power by (\d+)/))) add('rap', +m[1]);
    else if ((m = t.match(/Increases attack power by (\d+)/))) add('ap', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?spell hit rating by (\d+)/))) add('spellhit', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?hit rating by (\d+)/))) add('hit', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?spell critical strike rating by (\d+)/))) add('spellcrit', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?critical strike rating by (\d+)/))) add('crit', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?spell haste rating by (\d+)/))) add('spellhaste', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?haste rating by (\d+)/))) add('haste', +m[1]);
    else if ((m = t.match(/Increases (?:your )?defense rating by (\d+)/))) add('def', +m[1]);
    else if ((m = t.match(/Increases your dodge rating by (\d+)/))) add('dodge', +m[1]);
    else if ((m = t.match(/Increases your parry rating by (\d+)/))) add('parry', +m[1]);
    else if ((m = t.match(/Increases your shield block rating by (\d+)/))) add('block', +m[1]);
    else if ((m = t.match(/Increases the block value of your shield by (\d+)/))) add('blockval', +m[1]);
    else if ((m = t.match(/Restores (\d+) mana per 5 sec/))) add('mp5', +m[1]);
    else if ((m = t.match(/Increases your expertise rating by (\d+)/))) add('exp', +m[1]);
    else if ((m = t.match(/Your attacks ignore (\d+) of your opponent's armor/))) add('arp', +m[1]);
    else if ((m = t.match(/Increases (?:your )?spell penetration by (\d+)/))) add('spen', +m[1]);
    else if ((m = t.match(/(?:Improves|Increases) (?:your )?resilience rating by (\d+)/))) add('resil', +m[1]);
    else unparsed++;
  }
  return { stats, effects: unparsed };
}

interface Tooltip {
  name: string;
  quality: number;
  icon: string;
  tooltip: string;
}

async function fetchTooltip(id: number, locale: number): Promise<Tooltip | null> {
  const file = new URL(`${id}-${locale}.json`, CACHE_DIR);
  if (existsSync(file)) return JSON.parse(await readFile(file, 'utf8')) as Tooltip;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(tooltipUrl(id, locale), { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) {
      const json = (await res.json()) as Tooltip;
      await writeFile(file, JSON.stringify(json));
      return json;
    }
    if (res.status === 404) return null;
    await sleep(1500 * attempt);
  }
  throw new Error(`Wowhead не отдал предмет ${id} (locale ${locale})`);
}

async function mapLimit<T, R>(list: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i]);
      await sleep(80);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

function parseLoot(lua: string, key: string): { boss: string; ids: number[] }[] {
  const start = lua.indexOf(`data["${key}"] = {`);
  if (start < 0) throw new Error(`В AtlasLoot нет рейда ${key}`);
  const end = lua.indexOf('\ndata["', start + 10);
  const block = lua.slice(start, end < 0 ? undefined : end);
  const bosses: { boss: string; ids: number[] }[] = [];
  let current: { boss: string; ids: number[] } | null = null;
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    const name = line.match(/^name\s*=\s*.*?AL\["(.+?)"\]/);
    if (name) {
      current = { boss: name[1], ids: [] };
      bosses.push(current);
      continue;
    }
    if (line.startsWith('--')) continue;
    const item = line.match(/^\{\s*\d+\s*,\s*(\d+)\s*[,}]/);
    if (item && current) current.ids.push(Number(item[1]));
  }
  return bosses.filter((b) => b.ids.length);
}

function parseItem(id: number, en: Tooltip, ru: Tooltip, zone: number, boss: string): Item | null {
  const enTable = slotTable(en.tooltip);
  const slot = enTable ? SLOTS[enTable.slot] : undefined;
  if (!slot || en.quality < 4) return null;
  const ruTable = slotTable(ru.tooltip);
  const enLines = htmlToLines(en.tooltip);
  const ruLines = htmlToLines(ru.tooltip);
  const enText = enLines.join('\n');

  const num = (re: RegExp) => {
    const m = enText.match(re);
    return m ? Number(m[1]) : undefined;
  };
  const dmg = enText.match(/^(\d+) - (\d+)(?: \w+)? Damage$/m);
  const { stats } = parseStats(enLines);

  const setLine = ruLines.findIndex((l) => /\(\d+\/\d+\)$/.test(l));
  const setMatch = setLine >= 0 ? ruLines[setLine].match(/^(.+) \(\d+\/(\d+)\)$/) : null;

  const item: Item = {
    id,
    name: ru.name || en.name,
    nameEn: en.name,
    q: en.quality,
    icon: en.icon,
    ilvl: num(/Item Level (\d+)/) ?? 0,
    phase: num(/^Phase (\d)$/m) ?? null,
    slot,
    slotRu: ruTable?.slot ?? enTable?.slot ?? '',
    type: enTable?.type ?? null,
    typeRu: ruTable?.type ?? null,
    stats,
    statLines: ruLines.filter((l) => /^\+\d+ к /.test(l)),
    bind: ruLines.find((l) => /персональным/.test(l)) ?? null,
    unique: ruLines.some((l) => /^Уникальный/.test(l)),
    zone,
    boss,
  };
  const armor = num(/^(\d+) Armor$/m);
  if (armor) item.armor = armor;
  if (dmg) {
    item.dmg = [Number(dmg[1]), Number(dmg[2])];
    item.speed = num(/Speed ([\d.]+)/) ?? undefined;
    const dps = enText.match(/\(([\d.]+) damage per second\)/);
    if (dps) item.dps = Number(dps[1]);
  }
  const sockets = enLines.filter((l) => /^(Red|Blue|Yellow|Meta|Prismatic) Socket$/.test(l)).map((l) => l.split(' ')[0].toLowerCase());
  if (sockets.length) {
    item.sockets = sockets;
    item.socketsRu = ruLines.filter((l) => /гнездо$/.test(l));
    item.socketBonus = ruLines.find((l) => l.startsWith('При соответствии цвета:'));
  }
  const effects = ruLines.filter((l) => /^(Если на персонаже|Использование|Вероятность)/.test(l));
  if (effects.length) item.effects = effects;
  if (setMatch) {
    item.set = {
      name: setMatch[1],
      size: Number(setMatch[2]),
      bonuses: ruLines.filter((l) => /^\(\d+\) Набор/.test(l)),
    };
  }
  const classes = ruLines.find((l) => l.startsWith('Классы:'));
  if (classes) item.classes = classes.replace('Классы:', '').trim();
  return item;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  console.log('AtlasLoot: загружаю списки добычи…');
  const lua = await (await fetch(ATLASLOOT_URL)).text();

  const zones: { id: number; name: string; bosses: { name: string; items: number[] }[] }[] = [];
  const sources = new Map<number, { zone: number; boss: string }>();
  for (const raid of RAIDS) {
    const bosses = parseLoot(lua, raid.key);
    zones.push({ id: raid.id, name: raid.name, bosses: bosses.map((b) => ({ name: b.boss, items: b.ids })) });
    for (const b of bosses) for (const id of b.ids) if (!sources.has(id)) sources.set(id, { zone: raid.id, boss: b.boss });
    console.log(`  ${raid.name}: боссов ${bosses.length}, записей ${bosses.reduce((n, b) => n + b.ids.length, 0)}`);
  }

  const ids = [...sources.keys()];
  console.log(`Wowhead: ${ids.length} предметов, английские подсказки…`);
  const en = await mapLimit(ids, 4, (id) => fetchTooltip(id, LOCALE_EN));
  const candidates = ids.filter((_id, i) => {
    const t = en[i];
    return t && t.quality >= 4 && slotTable(t.tooltip) && SLOTS[slotTable(t.tooltip)!.slot];
  });
  console.log(`  экипируемых эпиков: ${candidates.length}, русские подсказки…`);
  const ru = await mapLimit(candidates, 4, (id) => fetchTooltip(id, LOCALE_RU));

  const items: Item[] = [];
  candidates.forEach((id, i) => {
    const enTip = en[ids.indexOf(id)];
    const ruTip = ru[i];
    if (!enTip || !ruTip) return;
    const src = sources.get(id)!;
    const item = parseItem(id, enTip, ruTip, src.zone, src.boss);
    if (item) items.push(item);
  });

  // В списках боссов оставляем только предметы, которые попали в базу
  const known = new Set(items.map((i) => i.id));
  const zonesOut = zones.map((z) => ({
    ...z,
    bosses: z.bosses.map((b) => ({ ...b, items: b.items.filter((id) => known.has(id)) })).filter((b) => b.items.length),
  }));

  await writeFile(
    OUT,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      sources: ['AtlasLoot Classic', 'Wowhead'],
      zones: zonesOut,
      items: items.sort((a, b) => b.ilvl - a.ilvl || a.id - b.id),
    }),
  );
  console.log(`Готово: ${items.length} предметов → public/data/items.json`);
}

await main();
