import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useCharacters, useItems, useMeta } from '../data/api.ts';
import { FACTION_LABEL, RACE_LABEL } from '../data/items.ts';
import { ROLES, ROLE_LABEL, specInfo } from '../data/specs.ts';
import type { Character, GearSlot, Item } from '../data/types.ts';
import { usePageTitle } from '../lib/helpers.ts';
import CharacterName from '../components/CharacterName.tsx';
import GameIcon from '../components/GameIcon.tsx';
import ItemIcon from '../components/ItemIcon.tsx';
import Segmented from '../components/Segmented.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import { useHoverTrigger } from '../components/Hover.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

const CLASS_ORDER = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'];
const STRIP: GearSlot[] = ['head', 'shoulder', 'chest', 'mainhand', 'trinket1', 'trinket2'];

type RoleFilter = 'all' | 'dps' | 'heal' | 'tank';

export default function CharactersPage() {
  usePageTitle('Персонажи');
  const characters = useCharacters();
  const items = useItems();
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const cls = params.get('class') ?? '';
  const role = (['dps', 'heal', 'tank'].find((r) => r === params.get('role')) ?? 'all') as RoleFilter;
  const realm = params.get('realm') ?? '';

  function setParam(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  const bossName = useMemo(() => {
    const map = new Map<number, string>();
    for (const zone of meta.data?.zones ?? []) for (const enc of zone.encounters) map.set(enc.id, enc.name);
    return map;
  }, [meta.data]);

  const list = characters.data?.list ?? [];
  const realms = useMemo(() => [...new Set(list.map((c) => c.realm))].sort(), [list]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.guild.toLowerCase().includes(q))
      .filter((c) => !cls || c.cls === cls)
      .filter((c) => role === 'all' || specInfo(c.cls, c.spec).role === role)
      .filter((c) => !realm || c.realm === realm)
      .sort((a, b) => b.ilvl - a.ilvl);
  }, [list, query, cls, role, realm]);

  if (characters.isPending) return <Loading />;
  if (characters.isError) return <ErrorState error={characters.error} onRetry={() => void characters.refetch()} />;

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">TBC Anniversary · демо-персонажи</p>
        <h1 className="page-title">Персонажи</h1>
        <p className="page-sub">
          {list.length} героев в настоящей рейдовой экипировке из базы Wowhead. Имена, гильдии и результаты придуманы для примера.
          Наведи на имя, чтобы увидеть, что на персонаже надето.
        </p>
      </header>

      <div className="filters">
        <input
          id="characters-search"
          className="input"
          type="search"
          placeholder="Имя или гильдия"
          value={query}
          onChange={(e) => setParam('q', e.target.value)}
          aria-label="Поиск по имени или гильдии"
        />
        <div className="class-filter" role="group" aria-label="Класс">
          {CLASS_ORDER.map((key) => {
            const info = specInfo(key, '');
            const active = cls === key;
            return (
              <button
                key={key}
                type="button"
                className={active ? 'class-btn is-active' : 'class-btn'}
                aria-pressed={active}
                title={info.clsName}
                onClick={() => setParam('class', active ? '' : key)}
              >
                <GameIcon icon={`classicon_${key}`} size={28} color={info.color} letter={info.clsName.charAt(0)} className="class-btn__icon" />
                <span className="sr-only">{info.clsName}</span>
              </button>
            );
          })}
        </div>
        <Segmented
          label="Роль"
          value={role}
          options={[{ value: 'all' as RoleFilter, label: 'Все' }, ...ROLES.map((r) => ({ value: r as RoleFilter, label: ROLE_LABEL[r] }))]}
          onChange={(r) => setParam('role', r === 'all' ? '' : r)}
        />
        <select id="characters-realm" className="input input--select" value={realm} onChange={(e) => setParam('realm', e.target.value)} aria-label="Сервер">
          <option value="">Все серверы</option>
          {realms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Никого не нашлось">
          <p>Попробуй убрать часть фильтров.</p>
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table table--roomy">
            <thead>
              <tr>
                <th scope="col" className="r">
                  #
                </th>
                <th scope="col">Персонаж</th>
                <th scope="col">Гильдия</th>
                <th scope="col" className="r">
                  Ур. предметов
                </th>
                <th scope="col">Лучший бой</th>
                <th scope="col">Экипировка</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <CharacterRow key={c.id} c={c} index={i} items={items.data?.byId} bossName={bossName} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CharacterRow({ c, index, items, bossName }: { c: Character; index: number; items?: Map<number, Item>; bossName: Map<number, string> }) {
  const info = specInfo(c.cls, c.spec);
  // Лучший бой — где персонаж выше всего относительно других игроков своей роли
  const best = c.parses.length ? [...c.parses].sort((a, b) => a.r / a.n - b.r / b.n || b.a - a.a)[0] : undefined;
  return (
    <tr>
      <td className="r muted">{index + 1}</td>
      <td>
        <span className="player">
          <SpecIcon cls={c.cls} spec={c.spec} size={32} />
          <span className="player__text">
            <CharacterName id={c.id} name={c.name} cls={c.cls} spec={c.spec} />
            <span className="player__sub">
              {RACE_LABEL[c.race]} · {info.name}, {info.clsName.toLowerCase()}
            </span>
          </span>
        </span>
      </td>
      <td>
        <span className="guild">
          <span className={`faction-dot faction-dot--${c.faction}`} title={FACTION_LABEL[c.faction]} />
          <span>
            <span className="guild__name">&lt;{c.guild}&gt;</span>
            <span className="player__sub">
              {c.realm} · {c.region}
            </span>
          </span>
        </span>
      </td>
      <td className="r">
        <span className="ilvl">{c.ilvl.toFixed(1)}</span>
      </td>
      <td>
        {best ? (
          <span className="best">
            <span>{bossName.get(best.e) ?? 'Босс'}</span>
            <span className="player__sub">
              {best.r}-е место из {best.n}
            </span>
          </span>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td>
        <span className="strip">
          {STRIP.map((slot) => {
            const id = c.gear[slot];
            const item = id !== null && items ? items.get(id) : undefined;
            return item ? <StripIcon key={slot} item={item} /> : <span key={slot} className="strip__empty" />;
          })}
        </span>
      </td>
    </tr>
  );
}

// Мини-иконки экипировки: из клавиатуры их пропускаем, полный список доступен по ссылке на персонажа
function StripIcon({ item }: { item: Item }) {
  const hover = useHoverTrigger({ kind: 'item', id: item.id });
  return (
    <Link to={`/item/${item.id}`} className="strip__item" aria-label={item.name} tabIndex={-1} {...hover}>
      <ItemIcon item={item} size={26} />
    </Link>
  );
}
