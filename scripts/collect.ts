// Сборщик данных: Warcraft Logs API v2 → public/data/*.json
//
//   node scripts/collect.ts          реальные данные (нужны WCL_CLIENT_ID и WCL_CLIENT_SECRET)
//   node scripts/collect.ts --demo   демо-набор без API, помечается как demo: true
//
// Ключ API живёт только в секретах GitHub Actions и в окружении сборки.
// В браузер он не попадает: сайт читает уже готовые JSON-файлы.

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const SITE = (process.env.WCL_SITE ?? 'https://fresh.warcraftlogs.com').replace(/\/$/, '');
const GAME_VERSION = process.env.GAME_VERSION ?? 'TBC Anniversary';
const MAX_ZONES = Number(process.env.WCL_MAX_ZONES ?? 5);
const ZONE_IDS = (process.env.WCL_ZONE_IDS ?? '')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);
const TOP_N = 100; // столько лучших парсов WCL отдаёт на первой странице рейтинга
const TOP_PLAYERS = 5; // сколько игроков сохраняем на каждый спек и босса
const SAFETY_POINTS = 200; // запас очков лимита WCL, при котором останавливаемся
const OUT_DIR = new URL('../public/data/', import.meta.url);

type Metric = 'dps' | 'hps';

interface SpecDef {
  cls: string; // слаг класса в WCL, например "Mage"
  spec: string; // слаг спека в WCL, например "Fire"
  metric: Metric;
}

interface PlayerParse {
  name: string;
  server: string;
  region: string;
  guild: string | null;
  amount: number;
  duration: number | null;
  date: number | null;
  report: string | null;
  fight: number | null;
  charId?: string; // только у демо-персонажей: ссылка на characters.json
}

interface SpecStats {
  cls: string;
  spec: string;
  metric: Metric;
  count: number;
  max: number;
  top10: number;
  median: number;
  players: PlayerParse[];
}

interface EncounterData {
  id: number;
  name: string;
  specs: SpecStats[];
}

interface ZoneRef {
  id: number;
  name: string;
  encounters: { id: number; name: string }[];
}

interface RateLimit {
  limitPerHour: number;
  pointsSpentThisHour: number;
  pointsResetIn: number;
}

// Запасной список, если WCL не отдаст классы через gameData.
const FALLBACK_SPECS: Record<string, string[]> = {
  Druid: ['Balance', 'Feral', 'Guardian', 'Restoration'],
  Hunter: ['BeastMastery', 'Marksmanship', 'Survival'],
  Mage: ['Arcane', 'Fire', 'Frost'],
  Paladin: ['Holy', 'Protection', 'Retribution'],
  Priest: ['Discipline', 'Holy', 'Shadow'],
  Rogue: ['Assassination', 'Combat', 'Subtlety'],
  Shaman: ['Elemental', 'Enhancement', 'Restoration'],
  Warlock: ['Affliction', 'Demonology', 'Destruction'],
  Warrior: ['Arms', 'Fury', 'Protection'],
};

// Лекарей ранжируем по исцелению (hps), всех остальных по урону (dps).
const HEALERS = new Set(['paladin/holy', 'priest/discipline', 'priest/holy', 'shaman/restoration', 'druid/restoration']);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function median(sortedDesc: number[]): number {
  const n = sortedDesc.length;
  if (!n) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 ? sortedDesc[mid] : (sortedDesc[mid - 1] + sortedDesc[mid]) / 2;
}

async function writeJson(name: string, data: unknown) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(new URL(name, OUT_DIR), JSON.stringify(data));
}

// Удаляет только файлы рейтингов: база предметов и персонажи лежат рядом и не трогаются
async function clearZoneFiles() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const file of await readdir(OUT_DIR)) {
    if (/^zone-\d+\.json$/.test(file)) await rm(new URL(file, OUT_DIR));
  }
}

// ---------- Warcraft Logs ----------

async function request(url: string, init: RequestInit, attempt = 1): Promise<Response> {
  const res = await fetch(url, init);
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const wait = 5000 * attempt;
    console.warn(`  HTTP ${res.status}, повтор через ${wait / 1000} с…`);
    await sleep(wait);
    return request(url, init, attempt + 1);
  }
  return res;
}

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  };
  // Аккаунты у сайтов Warcraft Logs общие: если поддомен не выдаст токен, пробуем основной сайт.
  const urls = [...new Set([`${SITE}/oauth/token`, 'https://www.warcraftlogs.com/oauth/token'])];
  let lastError = '';
  for (const url of urls) {
    const res = await request(url, init);
    if (res.ok) {
      const json = (await res.json()) as { access_token?: string };
      if (json.access_token) return json.access_token;
      lastError = 'в ответе нет access_token';
    } else {
      lastError = `HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
    }
  }
  throw new Error(`OAuth: ${lastError}`);
}

async function gql<T>(token: string, query: string): Promise<T> {
  const res = await request(`${SITE}/api/v2/client`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error('GraphQL: ' + json.errors.map((e) => e.message).join('; '));
  if (!json.data) throw new Error('GraphQL: пустой ответ');
  return json.data;
}

interface WclZone {
  id: number;
  name: string;
  frozen: boolean;
  encounters: { id: number; name: string }[];
}

async function discoverZones(token: string): Promise<ZoneRef[]> {
  const data = await gql<{ worldData: { expansions: { id: number; name: string; zones: WclZone[] }[] } }>(
    token,
    `query { worldData { expansions { id name zones { id name frozen encounters { id name } } } } }`,
  );
  const isRaid = (z: WclZone) => z.encounters.length > 0 && !/dungeon|heroic|mythic|challenge|test/i.test(z.name);
  const all = data.worldData.expansions.flatMap((e) => e.zones.map((z) => ({ ...z, expansion: e.id })));

  let picked: (WclZone & { expansion: number })[];
  if (ZONE_IDS.length) {
    picked = all.filter((z) => ZONE_IDS.includes(z.id));
  } else {
    const raids = all.filter(isRaid);
    const latest = Math.max(...raids.map((z) => z.expansion));
    const ofLatest = raids.filter((z) => z.expansion === latest);
    const live = ofLatest.filter((z) => !z.frozen);
    picked = (live.length ? live : ofLatest).sort((a, b) => b.id - a.id).slice(0, MAX_ZONES);
  }
  if (!picked.length) throw new Error('Не нашёл ни одного рейда. Проверь WCL_SITE или задай WCL_ZONE_IDS.');
  return picked.map((z) => ({ id: z.id, name: z.name, encounters: z.encounters.map((e) => ({ id: e.id, name: e.name })) }));
}

async function discoverSpecs(token: string): Promise<SpecDef[]> {
  let classes: { slug: string; specs: { slug: string }[] }[] = [];
  try {
    const data = await gql<{ gameData: { classes: { slug: string; specs: { slug: string }[] }[] } }>(
      token,
      `query { gameData { classes { slug specs { slug } } } }`,
    );
    classes = data.gameData.classes ?? [];
  } catch (err) {
    console.warn('  gameData.classes недоступен, беру запасной список спеков:', (err as Error).message);
  }
  if (!classes.length) {
    classes = Object.entries(FALLBACK_SPECS).map(([slug, specs]) => ({ slug, specs: specs.map((s) => ({ slug: s })) }));
  }
  return classes.flatMap((c) =>
    c.specs.map((s) => ({
      cls: c.slug,
      spec: s.slug,
      metric: HEALERS.has(`${c.slug}/${s.slug}`.toLowerCase()) ? ('hps' as const) : ('dps' as const),
    })),
  );
}

interface WclRanking {
  name?: string;
  amount?: number;
  duration?: number;
  startTime?: number;
  report?: { code?: string; fightID?: number } | null;
  guild?: { name?: string } | null;
  server?: { name?: string; region?: string } | null;
}

function toPlayer(r: WclRanking): PlayerParse {
  return {
    name: r.name ?? '—',
    server: r.server?.name ?? '',
    region: r.server?.region ?? '',
    guild: r.guild?.name ?? null,
    amount: round1(Number(r.amount) || 0),
    duration: typeof r.duration === 'number' ? r.duration : null,
    date: typeof r.startTime === 'number' ? r.startTime : null,
    report: r.report?.code ?? null,
    fight: r.report?.fightID ?? null,
  };
}

const SPECS_PER_QUERY = 10;

async function collectEncounter(
  token: string,
  enc: { id: number; name: string },
  specs: SpecDef[],
): Promise<{ data: EncounterData; rate: RateLimit }> {
  const result: SpecStats[] = [];
  let rate: RateLimit = { limitPerHour: 0, pointsSpentThisHour: 0, pointsResetIn: 0 };

  // Несколько спеков в одном запросе через алиасы s0, s1, …; порциями, чтобы запрос не был слишком тяжёлым.
  for (let start = 0; start < specs.length; start += SPECS_PER_QUERY) {
    const part = specs.slice(start, start + SPECS_PER_QUERY);
    const fields = part
      .map(
        (s, i) =>
          `s${i}: characterRankings(className: ${JSON.stringify(s.cls)}, specName: ${JSON.stringify(s.spec)}, metric: ${s.metric})`,
      )
      .join('\n      ');
    const query = `query {
    rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn }
    worldData { encounter(id: ${enc.id}) {
      ${fields}
    } }
  }`;
    const data = await gql<{ rateLimitData: RateLimit; worldData: { encounter: Record<string, unknown> | null } }>(
      token,
      query,
    );
    rate = data.rateLimitData;
    const encounter = data.worldData.encounter ?? {};

    part.forEach((s, i) => {
      const raw = encounter[`s${i}`] as { rankings?: WclRanking[] } | null | undefined;
      const list = Array.isArray(raw?.rankings) ? raw.rankings : [];
      const amounts = list
        .map((r) => Number(r.amount))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => b - a)
        .slice(0, TOP_N);
      if (!amounts.length) return;
      const players = [...list]
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
        .slice(0, TOP_PLAYERS)
        .map(toPlayer);
      result.push({
        cls: s.cls.toLowerCase(),
        spec: s.spec.toLowerCase(),
        metric: s.metric,
        count: amounts.length,
        max: round1(amounts[0]),
        top10: round1(mean(amounts.slice(0, 10))),
        median: round1(median(amounts)),
        players,
      });
    });
  }

  return { data: { id: enc.id, name: enc.name, specs: result }, rate };
}

async function collectReal(clientId: string, clientSecret: string) {
  console.log(`Источник: ${SITE} (${GAME_VERSION})`);
  const token = await getToken(clientId, clientSecret);
  const zones = await discoverZones(token);
  const specs = await discoverSpecs(token);
  console.log(`Рейдов: ${zones.length}, спеков: ${specs.length}`);

  await clearZoneFiles();
  const written: ZoneRef[] = [];
  let partial = false;

  for (const zone of zones) {
    if (partial) break;
    console.log(`\n${zone.name} (#${zone.id})`);
    const encounters: EncounterData[] = [];
    for (const enc of zone.encounters) {
      const { data, rate } = await collectEncounter(token, enc, specs);
      const left = rate.limitPerHour - rate.pointsSpentThisHour;
      console.log(`  ${enc.name}: спеков с данными ${data.specs.length}, осталось очков лимита ${Math.round(left)}`);
      if (data.specs.length) encounters.push(data);
      if (left < SAFETY_POINTS) {
        console.warn('  Лимит API почти исчерпан, сохраняю то, что успел собрать.');
        partial = true;
        break;
      }
    }
    if (encounters.length) {
      await writeJson(`zone-${zone.id}.json`, { id: zone.id, name: zone.name, encounters });
      written.push({ id: zone.id, name: zone.name, encounters: encounters.map((e) => ({ id: e.id, name: e.name })) });
    }
  }

  if (!written.length) throw new Error('Не удалось собрать ни одного рейда: рейтинги пустые.');
  await writeJson('meta.json', {
    generatedAt: new Date().toISOString(),
    demo: false,
    partial,
    site: SITE,
    gameVersion: GAME_VERSION,
    topN: TOP_N,
    zones: written,
  });
  console.log(`\nГотово: ${written.length} рейд(ов)${partial ? ', частично' : ''}.`);
}

// ---------- Демо-набор ----------

// Детерминированный генератор случайных чисел, чтобы демо не прыгало между сборками.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_ZONES: ZoneRef[] = [
  {
    id: 905,
    name: "Zul'Aman",
    encounters: ["Akil'zon", 'Nalorakk', "Jan'alai", 'Halazzi', 'Hex Lord Malacrass', "Zul'jin"].map((name, i) => ({ id: 90500 + i, name })),
  },
  {
    id: 904,
    name: 'Black Temple / Mount Hyjal',
    encounters: [
      'Rage Winterchill', 'Anetheron', "Kaz'rogal", 'Azgalor', 'Archimonde',
      "High Warlord Naj'entus", 'Supremus', 'Shade of Akama', 'Teron Gorefiend', 'Gurtogg Bloodboil',
      'Reliquary of Souls', 'Mother Shahraz', 'The Illidari Council', 'Illidan Stormrage',
    ].map((name, i) => ({ id: 90400 + i, name })),
  },
  {
    id: 903,
    name: 'Serpentshrine Cavern / Tempest Keep',
    encounters: [
      'Hydross the Unstable', 'The Lurker Below', 'Leotheras the Blind', 'Fathom-Lord Karathress', 'Morogrim Tidewalker',
      'Lady Vashj', "Al'ar", 'Void Reaver', 'High Astromancer Solarian', "Kael'thas Sunstrider",
    ].map((name, i) => ({ id: 90300 + i, name })),
  },
  {
    id: 902,
    name: 'Gruul / Magtheridon',
    encounters: ['High King Maulgar', 'Gruul the Dragonkiller', 'Magtheridon'].map((name, i) => ({ id: 90200 + i, name })),
  },
  {
    id: 901,
    name: 'Karazhan',
    encounters: [
      'Attumen the Huntsman', 'Moroes', 'Maiden of Virtue', 'Opera Hall', 'The Curator', 'Terestian Illhoof',
      'Shade of Aran', 'Netherspite', 'Chess Event', 'Prince Malchezaar', 'Nightbane',
    ].map((name, i) => ({ id: 90100 + i, name })),
  },
];

// Условная сила спеков для демо. Это не реальные данные.
const DEMO_POWER: Record<string, number> = {
  'mage/arcane': 1.0, 'warlock/destruction': 0.99, 'mage/fire': 0.97, 'rogue/combat': 0.96, 'warrior/fury': 0.95,
  'hunter/beastmastery': 0.94, 'shaman/enhancement': 0.9, 'warlock/affliction': 0.9, 'shaman/elemental': 0.89,
  'rogue/assassination': 0.88, 'warlock/demonology': 0.87, 'druid/feral': 0.86, 'hunter/marksmanship': 0.86,
  'mage/frost': 0.84, 'druid/balance': 0.84, 'hunter/survival': 0.83, 'paladin/retribution': 0.82,
  'warrior/arms': 0.8, 'priest/shadow': 0.77, 'rogue/subtlety': 0.72,
  'priest/holy': 1.0, 'shaman/restoration': 0.97, 'druid/restoration': 0.96, 'paladin/holy': 0.93, 'priest/discipline': 0.8,
  'paladin/protection': 1.0, 'warrior/protection': 0.95, 'druid/guardian': 0.92,
};

interface DemoCharacter {
  id: string;
  name: string;
  realm: string;
  region: string;
  guild: string;
  cls: string;
  spec: string;
  skill: number;
  parses?: { z: number; e: number; a: number; r: number; n: number }[];
}

const CHARACTERS = new URL('characters.json', OUT_DIR);
const TANKS = new Set(['warrior/protection', 'paladin/protection', 'druid/guardian']);
const roleOf = (key: string) => (HEALERS.has(key) ? 'heal' : TANKS.has(key) ? 'tank' : 'dps');

async function writeDemo() {
  const random = rng(20261114);
  const specs = Object.entries(FALLBACK_SPECS).flatMap(([cls, list]) => list.map((spec) => `${cls}/${spec}`.toLowerCase()));

  // Демо-персонажи из characters.json становятся игроками в рейтингах боссов
  let charactersFile: { characters: DemoCharacter[] } | null = null;
  try {
    charactersFile = JSON.parse(await readFile(CHARACTERS, 'utf8')) as { characters: DemoCharacter[] };
  } catch {
    console.warn('characters.json не найден: в рейтингах будут безымянные игроки.');
  }
  const bySpec = new Map<string, DemoCharacter[]>();
  for (const c of charactersFile?.characters ?? []) {
    const key = `${c.cls}/${c.spec}`;
    bySpec.set(key, [...(bySpec.get(key) ?? []), c]);
  }
  const parses = new Map<string, NonNullable<DemoCharacter['parses']>>();
  const today = Date.UTC(2026, 10, 14);

  await clearZoneFiles();
  for (const zone of DEMO_ZONES) {
    const encounters: EncounterData[] = zone.encounters.map((enc) => {
      const bossFactor = 0.85 + random() * 0.4;
      const list: SpecStats[] = [];
      const everyone: { charId: string; role: string; amount: number }[] = [];
      for (const key of specs) {
        const power = DEMO_POWER[key];
        if (!power) continue;
        const [cls, spec] = key.split('/');
        const metric: Metric = HEALERS.has(key) ? 'hps' : 'dps';
        const base = metric === 'hps' ? 1450 : TANKS.has(key) ? 950 : 1750;
        const med = base * power * bossFactor * (0.95 + random() * 0.1);
        const squad = bySpec.get(key) ?? [];
        const players: PlayerParse[] = squad.length
          ? squad.map((c) => ({
              name: c.name,
              server: c.realm,
              region: c.region,
              guild: c.guild,
              amount: round1(med * (1.12 + (c.skill - 0.9) * 1.4) * (0.97 + random() * 0.06)),
              duration: Math.round((150 + random() * 240) * 1000),
              date: today - Math.floor(random() * 21) * 86_400_000,
              report: null,
              fight: null,
              charId: c.id,
            }))
          : Array.from({ length: TOP_PLAYERS }, (_, i) => ({
              name: `Пример ${i + 1}`,
              server: 'Демо',
              region: 'EU',
              guild: 'Демо-гильдия',
              amount: round1(med * (1.3 - i * 0.04)),
              duration: Math.round((150 + random() * 240) * 1000),
              date: null,
              report: null,
              fight: null,
            }));
        players.sort((a, b) => b.amount - a.amount);
        for (const p of players) if (p.charId) everyone.push({ charId: p.charId, role: roleOf(key), amount: p.amount });
        list.push({
          cls,
          spec,
          metric,
          count: 100,
          max: round1(Math.max(players[0]?.amount ?? 0, med * 1.28)),
          top10: round1(med * (1.15 + random() * 0.06)),
          median: round1(med),
          players,
        });
      }
      // Место персонажа среди всех игроков той же роли на этом боссе
      for (const role of ['dps', 'heal', 'tank']) {
        const group = everyone.filter((p) => p.role === role).sort((a, b) => b.amount - a.amount);
        group.forEach((p, i) => {
          const own = parses.get(p.charId) ?? [];
          own.push({ z: zone.id, e: enc.id, a: p.amount, r: i + 1, n: group.length });
          parses.set(p.charId, own);
        });
      }
      return { id: enc.id, name: enc.name, specs: list };
    });
    await writeJson(`zone-${zone.id}.json`, { id: zone.id, name: zone.name, encounters });
  }

  if (charactersFile) {
    for (const c of charactersFile.characters) c.parses = parses.get(c.id) ?? [];
    await writeFile(CHARACTERS, JSON.stringify(charactersFile));
  }
  await writeJson('meta.json', {
    generatedAt: new Date().toISOString(),
    demo: true,
    partial: false,
    site: SITE,
    gameVersion: GAME_VERSION,
    topN: TOP_N,
    zones: DEMO_ZONES,
  });
  console.log('Демо-данные записаны в public/data/');
}

// ---------- Запуск ----------

if (process.argv.includes('--demo')) {
  await writeDemo();
} else {
  const id = process.env.WCL_CLIENT_ID;
  const secret = process.env.WCL_CLIENT_SECRET;
  if (!id || !secret) {
    console.warn('WCL_CLIENT_ID и WCL_CLIENT_SECRET не заданы: оставляю текущие данные (демо).');
  } else {
    await collectReal(id, secret);
  }
}
