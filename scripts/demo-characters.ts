// Демо-персонажи: 56 героев, по два на каждый спек.
//   node scripts/demo-characters.ts
//
// Имена, гильдии и прогресс выдуманы. Экипировка — настоящие рейдовые предметы из public/data/items.json:
// для каждого слота подбирается вещь подходящего типа брони и с нужными характеристиками.

import { readFile, writeFile } from 'node:fs/promises';

const ITEMS = new URL('../public/data/items.json', import.meta.url);
const OUT = new URL('../public/data/characters.json', import.meta.url);

type Profile = 'caster' | 'healer' | 'agi' | 'str' | 'tank';
type WeaponPlan = 'twohand' | 'dual' | 'shield' | 'caster' | 'caster-shield' | 'feral' | 'hunter';

interface Item {
  id: number;
  q: number;
  ilvl: number;
  slot: string;
  type: string | null;
  armor?: number;
  stats: Record<string, number | undefined>;
  unique: boolean;
}

interface SpecPlan {
  cls: string;
  spec: string;
  profile: Profile;
  weapons: WeaponPlan;
}

const ARMOR: Record<string, string> = {
  warrior: 'Plate', paladin: 'Plate', hunter: 'Mail', shaman: 'Mail',
  rogue: 'Leather', druid: 'Leather', priest: 'Cloth', mage: 'Cloth', warlock: 'Cloth',
};

const WEAPON_TYPES: Record<string, string[]> = {
  warrior: ['Axe', 'Sword', 'Mace', 'Dagger', 'Fist Weapon', 'Polearm', 'Staff'],
  paladin: ['Axe', 'Sword', 'Mace', 'Polearm'],
  hunter: ['Axe', 'Sword', 'Dagger', 'Fist Weapon', 'Polearm', 'Staff'],
  rogue: ['Sword', 'Mace', 'Dagger', 'Fist Weapon'],
  priest: ['Mace', 'Dagger', 'Staff'],
  shaman: ['Axe', 'Mace', 'Dagger', 'Fist Weapon', 'Staff'],
  mage: ['Sword', 'Dagger', 'Staff'],
  warlock: ['Sword', 'Dagger', 'Staff'],
  druid: ['Mace', 'Dagger', 'Fist Weapon', 'Polearm', 'Staff'],
};

const RANGED_TYPES: Record<string, string[]> = {
  warrior: ['Bow', 'Gun', 'Crossbow', 'Thrown'],
  rogue: ['Bow', 'Gun', 'Crossbow', 'Thrown'],
  hunter: ['Bow', 'Gun', 'Crossbow'],
  priest: ['Wand'],
  mage: ['Wand'],
  warlock: ['Wand'],
  paladin: ['Libram'],
  shaman: ['Totem'],
  druid: ['Idol'],
};

const PLANS: SpecPlan[] = [
  { cls: 'warrior', spec: 'arms', profile: 'str', weapons: 'twohand' },
  { cls: 'warrior', spec: 'fury', profile: 'str', weapons: 'dual' },
  { cls: 'warrior', spec: 'protection', profile: 'tank', weapons: 'shield' },
  { cls: 'paladin', spec: 'holy', profile: 'healer', weapons: 'caster-shield' },
  { cls: 'paladin', spec: 'protection', profile: 'tank', weapons: 'shield' },
  { cls: 'paladin', spec: 'retribution', profile: 'str', weapons: 'twohand' },
  { cls: 'hunter', spec: 'beastmastery', profile: 'agi', weapons: 'hunter' },
  { cls: 'hunter', spec: 'marksmanship', profile: 'agi', weapons: 'hunter' },
  { cls: 'hunter', spec: 'survival', profile: 'agi', weapons: 'hunter' },
  { cls: 'rogue', spec: 'assassination', profile: 'agi', weapons: 'dual' },
  { cls: 'rogue', spec: 'combat', profile: 'agi', weapons: 'dual' },
  { cls: 'rogue', spec: 'subtlety', profile: 'agi', weapons: 'dual' },
  { cls: 'priest', spec: 'discipline', profile: 'healer', weapons: 'caster' },
  { cls: 'priest', spec: 'holy', profile: 'healer', weapons: 'caster' },
  { cls: 'priest', spec: 'shadow', profile: 'caster', weapons: 'caster' },
  { cls: 'shaman', spec: 'elemental', profile: 'caster', weapons: 'caster-shield' },
  { cls: 'shaman', spec: 'enhancement', profile: 'agi', weapons: 'dual' },
  { cls: 'shaman', spec: 'restoration', profile: 'healer', weapons: 'caster-shield' },
  { cls: 'mage', spec: 'arcane', profile: 'caster', weapons: 'caster' },
  { cls: 'mage', spec: 'fire', profile: 'caster', weapons: 'caster' },
  { cls: 'mage', spec: 'frost', profile: 'caster', weapons: 'caster' },
  { cls: 'warlock', spec: 'affliction', profile: 'caster', weapons: 'caster' },
  { cls: 'warlock', spec: 'demonology', profile: 'caster', weapons: 'caster' },
  { cls: 'warlock', spec: 'destruction', profile: 'caster', weapons: 'caster' },
  { cls: 'druid', spec: 'balance', profile: 'caster', weapons: 'caster' },
  { cls: 'druid', spec: 'feral', profile: 'agi', weapons: 'feral' },
  { cls: 'druid', spec: 'guardian', profile: 'tank', weapons: 'feral' },
  { cls: 'druid', spec: 'restoration', profile: 'healer', weapons: 'caster' },
];

const NAMES = [
  'Aelindra', 'Brakthar', 'Caelith', 'Draskor', 'Elunara', 'Fenmoor', 'Gorvash', 'Halvora', 'Ilyrien', 'Jorthak',
  'Kaelvane', 'Lyssira', 'Morgath', 'Nyxelle', 'Orgrin', 'Pyrevoss', 'Quilara', 'Rhovanth', 'Sylvarel', 'Tharnok',
  'Ulvessa', 'Vorlaith', 'Wrenna', 'Xalthor', 'Ysolde', 'Zarkhan', 'Aldovar', 'Brisera', 'Corvane', 'Dagrul',
  'Eryndis', 'Faelyra', 'Grimthar', 'Hessaly', 'Ithrandel', 'Jaskar', 'Korvina', 'Lothrain', 'Myrrel', 'Nerith',
  'Ostrava', 'Pellinor', 'Quorath', 'Riveth', 'Saelith', 'Tovrik', 'Umbrana', 'Velkar', 'Wynstrel', 'Xyrra',
  'Yorvath', 'Zelenna', 'Ashkael', 'Belvoren', 'Cindrel', 'Durnak',
];

const GUILDS = [
  { name: 'Ember Covenant', realm: 'Thunderstrike', region: 'EU', faction: 'alliance' },
  { name: 'Quiet Thunder', realm: 'Thunderstrike', region: 'EU', faction: 'horde' },
  { name: 'Night Shift', realm: 'Spineshatter', region: 'EU', faction: 'horde' },
  { name: 'Moonfall', realm: 'Spineshatter', region: 'EU', faction: 'alliance' },
  { name: 'Last Pull', realm: 'Dreamscythe', region: 'US', faction: 'alliance' },
  { name: 'Iron Tide', realm: 'Dreamscythe', region: 'US', faction: 'horde' },
  { name: 'Second Wind', realm: 'Nightslayer', region: 'US', faction: 'horde' },
  { name: 'Loot Council', realm: 'Nightslayer', region: 'US', faction: 'alliance' },
];

const RACES: Record<string, Record<string, string[]>> = {
  alliance: {
    warrior: ['human', 'dwarf', 'nightelf', 'gnome', 'draenei'],
    paladin: ['human', 'dwarf', 'draenei'],
    hunter: ['dwarf', 'nightelf', 'draenei'],
    rogue: ['human', 'dwarf', 'nightelf', 'gnome'],
    priest: ['human', 'dwarf', 'nightelf', 'draenei'],
    shaman: ['draenei'],
    mage: ['human', 'gnome', 'draenei'],
    warlock: ['human', 'gnome'],
    druid: ['nightelf'],
  },
  horde: {
    warrior: ['orc', 'undead', 'tauren', 'troll'],
    paladin: ['bloodelf'],
    hunter: ['orc', 'tauren', 'troll', 'bloodelf'],
    rogue: ['orc', 'undead', 'troll', 'bloodelf'],
    priest: ['undead', 'troll', 'bloodelf'],
    shaman: ['orc', 'tauren', 'troll'],
    mage: ['undead', 'troll', 'bloodelf'],
    warlock: ['orc', 'undead', 'bloodelf'],
    druid: ['tauren'],
  },
};

// Детерминированный генератор, чтобы персонажи не менялись между сборками
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

const st = (item: Item, key: string) => item.stats[key] ?? 0;

// Насколько вещь подходит профилю. null — не подходит совсем.
function fit(item: Item, profile: Profile, cls: string): number | null {
  const caster = st(item, 'sp') + st(item, 'spellhit') + st(item, 'spellcrit') + st(item, 'spellhaste');
  const heal = st(item, 'heal') + st(item, 'mp5') * 2;
  const melee = st(item, 'agi') + st(item, 'str') + st(item, 'ap') + st(item, 'hit') + st(item, 'crit') + st(item, 'exp') + st(item, 'feralap');
  const tank = st(item, 'def') + st(item, 'dodge') + st(item, 'parry') + st(item, 'block') + st(item, 'blockval') * 0.5;
  switch (profile) {
    case 'caster':
      if (melee > 0 || tank > 0 || (st(item, 'heal') > 0 && st(item, 'sp') === 0)) return null;
      return caster + st(item, 'int') * 0.3 + st(item, 'sta') * 0.05;
    case 'healer':
      if (melee > 0 || tank > 0 || caster - st(item, 'sp') > 0) return null;
      return heal + st(item, 'sp') * 0.6 + st(item, 'int') * 0.5 + st(item, 'spi') * 0.4;
    case 'agi': {
      if (caster > 0 || heal > 0 || tank > 0) return null;
      if (cls !== 'hunter' && cls !== 'shaman' && st(item, 'int') > 0) return null;
      if (st(item, 'str') > st(item, 'agi') && cls !== 'shaman') return null;
      return st(item, 'agi') + st(item, 'ap') * 0.5 + st(item, 'rap') * 0.4 + st(item, 'feralap') * 0.4 + st(item, 'hit') + st(item, 'crit') * 0.8 + st(item, 'haste') * 0.8 + st(item, 'exp') * 0.9;
    }
    case 'str':
      if (caster > 0 || heal > 0 || tank > 0 || st(item, 'int') > 0) return null;
      if (st(item, 'agi') > st(item, 'str') * 1.5 && st(item, 'str') === 0 && st(item, 'ap') === 0) return null;
      return st(item, 'str') + st(item, 'ap') * 0.5 + st(item, 'agi') * 0.5 + st(item, 'hit') + st(item, 'crit') * 0.8 + st(item, 'haste') * 0.8 + st(item, 'exp') * 0.9;
    case 'tank':
      if (caster > 0 || heal > 0 || st(item, 'int') > 0) return null;
      if (cls === 'druid') return tank + st(item, 'agi') * 0.6 + st(item, 'sta') * 0.6 + st(item, 'feralap') * 0.2 + (item.armor ?? 0) * 0.01;
      if (tank === 0 && st(item, 'sta') < 20) return null;
      return tank + st(item, 'sta') * 0.6 + (item.armor ?? 0) * 0.01;
  }
}

function main(items: Item[]) {
  const random = rng(1114);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const characters: Record<string, unknown>[] = [];
  const caps = [125, 128, 134, 141, 141, 146, 151, 156, 164];

  const names = [...NAMES];
  PLANS.forEach((plan, planIndex) => {
    for (let n = 0; n < 2; n++) {
      const name = names[(planIndex * 2 + n) % names.length];
      const guild = GUILDS[(planIndex * 3 + n * 5) % GUILDS.length];
      const race = pick(RACES[guild.faction][plan.cls]);
      const cap = pick(caps);
      const used = new Set<number>();
      const armorType = ARMOR[plan.cls];
      const weaponTypes = WEAPON_TYPES[plan.cls];

      // Лучшие подходящие вещи в пределах «прогресса» персонажа, с небольшой случайностью.
      // anyIlvl — можно выше прогресса (берём ближайшие по уровню), noFit — без проверки характеристик.
      interface Opts {
        relaxed?: boolean;
        anyIlvl?: boolean;
        noFit?: boolean;
      }
      const choose = (filter: (it: Item) => boolean, profile: Profile = plan.profile, opts: Opts = {}): number | null => {
        const scored = items
          .filter((it) => !used.has(it.id) && (opts.anyIlvl || it.ilvl <= cap) && filter(it))
          .map((it) => ({ it, score: opts.noFit ? 1 : fit(it, profile, plan.cls) }))
          .filter((x): x is { it: Item; score: number } => x.score !== null && (opts.relaxed || x.score > 0))
          .sort((a, b) =>
            opts.anyIlvl ? a.it.ilvl - b.it.ilvl : b.it.ilvl + b.score * 0.4 - (a.it.ilvl + a.score * 0.4),
          );
        if (!scored.length) return null;
        const top = scored.slice(0, 3);
        const chosen = top[Math.floor(random() * top.length)].it;
        used.add(chosen.id);
        return chosen.id;
      };
      const firstOf = (...attempts: (() => number | null)[]): number | null => {
        for (const attempt of attempts) {
          const id = attempt();
          if (id !== null) return id;
        }
        return null;
      };
      // Если подходящей брони своего типа нет, берём более лёгкую: так и делали в TBC
      const LIGHTER: Record<string, string[]> = {
        Plate: ['Mail', 'Leather'],
        Mail: ['Leather', 'Cloth'],
        Leather: ['Cloth'],
        Cloth: [],
      };
      const armorSlot = (slot: string) =>
        firstOf(
          () => choose((it) => it.slot === slot && it.type === armorType),
          () => choose((it) => it.slot === slot && it.type === armorType, plan.profile, { anyIlvl: true }),
          ...LIGHTER[armorType].map((t) => () => choose((it) => it.slot === slot && it.type === t)),
          ...LIGHTER[armorType].map((t) => () => choose((it) => it.slot === slot && it.type === t, plan.profile, { anyIlvl: true })),
          () => choose((it) => it.slot === slot && it.type === armorType, plan.profile, { relaxed: true, anyIlvl: true }),
        );
      const any = (filter: (it: Item) => boolean, profile: Profile = plan.profile) =>
        firstOf(
          () => choose(filter, profile),
          () => choose(filter, profile, { anyIlvl: true }),
          () => choose(filter, profile, { relaxed: true, anyIlvl: true }),
        );
      const jewel = (slot: string) => any((it) => it.slot === slot);
      const isWeapon = (it: Item) => it.type !== null && weaponTypes.includes(it.type);

      const gear: Record<string, number | null> = {
        head: armorSlot('head'),
        neck: jewel('neck'),
        shoulder: armorSlot('shoulder'),
        back: jewel('back'),
        chest: armorSlot('chest'),
        wrist: armorSlot('wrist'),
        hands: armorSlot('hands'),
        waist: armorSlot('waist'),
        legs: armorSlot('legs'),
        feet: armorSlot('feet'),
        finger1: jewel('finger'),
        finger2: jewel('finger'),
        trinket1: jewel('trinket'),
        trinket2: jewel('trinket'),
        mainhand: null,
        offhand: null,
        ranged: null,
      };

      const oneHand = (it: Item) => (it.slot === 'mainhand' || it.slot === 'onehand') && isWeapon(it);
      const offWeapon = (it: Item) => (it.slot === 'onehand' || (it.slot === 'offhand' && it.type !== 'Shield')) && isWeapon(it);
      const shield = (it: Item) => it.slot === 'offhand' && it.type === 'Shield';
      const twoHand = (it: Item) => it.slot === 'twohand' && isWeapon(it);

      switch (plan.weapons) {
        case 'twohand':
          gear.mainhand = any(twoHand);
          break;
        case 'dual':
          gear.mainhand = any(oneHand);
          gear.offhand = any(offWeapon);
          break;
        case 'shield':
          gear.mainhand = firstOf(() => any(oneHand), () => any(oneHand, 'str'));
          gear.offhand = any(shield);
          break;
        case 'caster-shield':
          gear.mainhand = any(oneHand);
          gear.offhand = firstOf(() => any(shield), () => any((it) => it.slot === 'holdable'));
          break;
        case 'caster':
          if (random() < 0.35) gear.mainhand = choose((it) => twoHand(it) && it.type === 'Staff');
          if (!gear.mainhand) {
            gear.mainhand = any(oneHand);
            gear.offhand = any((it) => it.slot === 'holdable');
          }
          break;
        case 'feral':
          gear.mainhand = any(twoHand, 'agi');
          break;
        case 'hunter':
          gear.mainhand = any(twoHand);
          break;
      }
      // Дальний бой и реликвии: у реликвий почти нет характеристик, поэтому подбираем по типу
      const rangedTypes = RANGED_TYPES[plan.cls] ?? [];
      const rangedFilter = (it: Item) => (it.slot === 'ranged' || it.slot === 'relic') && it.type !== null && rangedTypes.includes(it.type);
      gear.ranged = firstOf(
        () => choose(rangedFilter),
        () => choose(rangedFilter, plan.profile, { noFit: true }),
        () => choose(rangedFilter, plan.profile, { noFit: true, anyIlvl: true }),
      );

      const equipped = Object.values(gear).filter((id): id is number => id !== null);
      const byId = new Map(items.map((it) => [it.id, it]));
      const ilvl = equipped.length ? Math.round((equipped.reduce((sum, id) => sum + (byId.get(id)?.ilvl ?? 0), 0) / equipped.length) * 10) / 10 : 0;

      characters.push({
        id: `${name.toLowerCase()}-${guild.realm.toLowerCase()}`,
        name,
        realm: guild.realm,
        region: guild.region,
        faction: guild.faction,
        race,
        cls: plan.cls,
        spec: plan.spec,
        guild: guild.name,
        level: 70,
        skill: Math.round((0.9 + random() * 0.14) * 1000) / 1000,
        ilvl,
        gear,
      });
    }
  });
  return characters;
}

const db = JSON.parse(await readFile(ITEMS, 'utf8')) as { items: Item[] };
const characters = main(db.items);
await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), demo: true, characters }));
const empty = characters.reduce((n, c) => n + Object.values(c.gear as Record<string, number | null>).filter((v) => v === null).length, 0);
console.log(`Готово: ${characters.length} персонажей, пустых слотов ${empty} → public/data/characters.json`);
