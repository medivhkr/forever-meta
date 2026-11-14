import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useCharacters, useItems } from '../data/api.ts';
import { ARMOR_TYPES, FOCUS_LABEL, SLOT_LABEL, STAT_SHORT, itemFocus, keyStats, type Focus } from '../data/items.ts';
import { zoneTitle } from '../data/specs.ts';
import type { ItemSlot } from '../data/types.ts';
import { usePageTitle } from '../lib/helpers.ts';
import ItemLink from '../components/ItemLink.tsx';
import Segmented from '../components/Segmented.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

const PAGE = 60;
const FOCUS_OPTIONS: (Focus | 'all')[] = ['all', 'caster', 'healer', 'agi', 'str', 'tank'];

export default function ItemsPage() {
  usePageTitle('Предметы');
  const items = useItems();
  const characters = useCharacters();
  const [params, setParams] = useSearchParams();
  const [shown, setShown] = useState(PAGE);
  const query = params.get('q') ?? '';
  const deferredQuery = useDeferredValue(query);
  const zone = params.get('raid') ?? '';
  const slot = params.get('slot') ?? '';
  const armor = params.get('armor') ?? '';
  const focus = (FOCUS_OPTIONS.find((f) => f === params.get('for')) ?? 'all') as Focus | 'all';

  function setParam(key: string, value: string) {
    setShown(PAGE);
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

  // Сколько демо-персонажей носит каждый предмет
  const wearers = useMemo(() => {
    const count = new Map<number, number>();
    for (const c of characters.data?.list ?? []) {
      for (const id of Object.values(c.gear)) if (id !== null) count.set(id, (count.get(id) ?? 0) + 1);
    }
    return count;
  }, [characters.data]);

  const all = items.data?.db.items ?? [];
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().replace(/ё/g, 'е');
    return all.filter((item) => {
      if (q && !item.name.toLowerCase().replace(/ё/g, 'е').includes(q) && !item.nameEn.toLowerCase().includes(q)) return false;
      if (zone && String(item.zone) !== zone) return false;
      if (slot && item.slot !== slot) return false;
      if (armor && item.type !== armor) return false;
      if (focus !== 'all' && itemFocus(item) !== focus) return false;
      return true;
    });
  }, [all, deferredQuery, zone, slot, armor, focus]);

  if (items.isPending) return <Loading />;
  if (items.isError) return <ErrorState error={items.error} onRetry={() => void items.refetch()} />;

  const zones = items.data.db.zones;
  const zoneNames = items.data.zoneName;
  const slots = Object.keys(SLOT_LABEL) as ItemSlot[];

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">База предметов · TBC</p>
        <h1 className="page-title">Предметы</h1>
        <p className="page-sub">
          {all.length} эпических предметов из {zones.length} рейдов TBC: названия, характеристики и иконки из базы Wowhead, списки
          добычи по боссам — из AtlasLoot. Наведи на предмет, чтобы увидеть подсказку.
        </p>
      </header>

      <div className="filters">
        <input
          id="items-search"
          className="input"
          type="search"
          placeholder="Название, можно по-английски"
          value={query}
          onChange={(e) => setParam('q', e.target.value)}
          aria-label="Поиск предмета"
        />
        <select id="items-raid" className="input input--select" value={zone} onChange={(e) => setParam('raid', e.target.value)} aria-label="Рейд">
          <option value="">Все рейды</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {zoneTitle(z.name).ru}
            </option>
          ))}
        </select>
        <select id="items-slot" className="input input--select" value={slot} onChange={(e) => setParam('slot', e.target.value)} aria-label="Слот">
          <option value="">Все слоты</option>
          {slots.map((s) => (
            <option key={s} value={s}>
              {SLOT_LABEL[s]}
            </option>
          ))}
        </select>
        <select id="items-armor" className="input input--select" value={armor} onChange={(e) => setParam('armor', e.target.value)} aria-label="Тип брони">
          <option value="">Любая броня</option>
          {ARMOR_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar">
        <Segmented
          label="Для кого"
          value={focus}
          options={FOCUS_OPTIONS.map((f) => ({ value: f, label: f === 'all' ? 'Все' : FOCUS_LABEL[f] }))}
          onChange={(f) => setParam('for', f === 'all' ? '' : f)}
        />
        <span className="muted small">Найдено: {filtered.length}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Ничего не нашлось">
          <p>Попробуй убрать часть фильтров.</p>
        </EmptyState>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Предмет</th>
                  <th scope="col" className="r">
                    Ур.
                  </th>
                  <th scope="col">Слот</th>
                  <th scope="col">Главное</th>
                  <th scope="col">Источник</th>
                  <th scope="col" className="r">
                    Носят
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((item) => {
                  const zoneName = zoneNames.get(item.zone);
                  return (
                    <tr key={item.id}>
                      <td className="cell-wrap">
                        <ItemLink item={item} size={30} />
                      </td>
                      <td className="r strong">{item.ilvl}</td>
                      <td className="muted">
                        {item.slotRu}
                        {item.typeRu ? `, ${item.typeRu.toLowerCase()}` : ''}
                      </td>
                      <td>
                        <span className="badges">
                          {keyStats(item).map((s) => (
                            <span key={s.key} className="badge">
                              +{s.value} {STAT_SHORT[s.key] ?? s.key}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="muted cell-wrap">
                        {item.boss}
                        {zoneName ? <span className="player__sub">{zoneTitle(zoneName).ru}</span> : null}
                      </td>
                      <td className="r muted">{wearers.get(item.id) ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown < filtered.length && (
            <div className="more">
              <button type="button" className="btn" onClick={() => setShown((n) => n + PAGE)}>
                Показать ещё {Math.min(PAGE, filtered.length - shown)}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
