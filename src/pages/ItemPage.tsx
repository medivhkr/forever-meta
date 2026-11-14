import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta } from '../data/api.ts';
import { FOCUS_LABEL, bossKey, itemFocus, wowheadUrl } from '../data/items.ts';
import { specInfo, zoneTitle } from '../data/specs.ts';
import { usePageTitle } from '../lib/helpers.ts';
import CharacterName from '../components/CharacterName.tsx';
import ItemLink from '../components/ItemLink.tsx';
import ItemTooltip from '../components/ItemTooltip.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

export default function ItemPage() {
  const { id } = useParams();
  const items = useItems();
  const characters = useCharacters();
  const meta = useMeta();
  const item = items.data?.byId.get(Number(id));
  usePageTitle(item?.name ?? 'Предмет');

  const wearers = useMemo(
    () => (item ? (characters.data?.list ?? []).filter((c) => Object.values(c.gear).includes(item.id)) : []),
    [item, characters.data],
  );

  // Похожие: тот же слот и та же роль, ближайшие по уровню
  const similar = useMemo(() => {
    if (!item || !items.data) return [];
    const focus = itemFocus(item);
    return items.data.db.items
      .filter((other) => other.id !== item.id && other.slot === item.slot && (item.type === null || other.type === item.type) && itemFocus(other) === focus)
      .sort((a, b) => Math.abs(a.ilvl - item.ilvl) - Math.abs(b.ilvl - item.ilvl))
      .slice(0, 6);
  }, [item, items.data]);

  // Если этот босс есть в рейтингах сайта, даём ссылку на его страницу
  const bossLink = useMemo(() => {
    if (!item || !meta.data) return null;
    const key = bossKey(item.boss);
    for (const zone of meta.data.zones) {
      const enc = zone.encounters.find((e) => bossKey(e.name) === key);
      if (enc) return `/raid/${zone.id}/boss/${enc.id}`;
    }
    return null;
  }, [item, meta.data]);

  if (items.isPending) return <Loading />;
  if (items.isError) return <ErrorState error={items.error} onRetry={() => void items.refetch()} />;
  if (!item) {
    return (
      <EmptyState title="Такого предмета нет в базе">
        <p>
          <Link to="/items">Все предметы</Link>
        </p>
      </EmptyState>
    );
  }

  const zoneName = items.data.zoneName.get(item.zone);

  return (
    <>
      <nav className="crumbs" aria-label="Путь">
        <Link to="/items">Предметы</Link>
        <span aria-hidden="true">/</span>
        <span>{item.name}</span>
      </nav>

      <div className="item-page">
        <div className="item-page__tooltip">
          <ItemTooltip item={item} large />
          <a className="btn btn--ghost" href={wowheadUrl(item.id)} target="_blank" rel="noreferrer">
            Открыть на Wowhead ↗
          </a>
        </div>

        <div className="item-page__side">
          <section className="panel">
            <h2>Где достать</h2>
            <p>
              {bossLink ? <Link to={bossLink}>{item.boss}</Link> : item.boss}
              {zoneName ? ` · ${zoneTitle(zoneName).ru}` : ''}
            </p>
            <p className="muted small">
              {item.nameEn} · {FOCUS_LABEL[itemFocus(item)].toLowerCase()}
              {item.phase ? ` · ${item.phase}-я фаза` : ''}
            </p>
          </section>

          <section className="panel">
            <h2>Кто носит</h2>
            {wearers.length ? (
              <ul className="people">
                {wearers.map((c) => {
                  const info = specInfo(c.cls, c.spec);
                  return (
                    <li key={c.id}>
                      <SpecIcon cls={c.cls} spec={c.spec} size={24} />
                      <CharacterName id={c.id} name={c.name} cls={c.cls} spec={c.spec} />
                      <span className="muted small">
                        {info.name}, {info.clsName.toLowerCase()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Никто из демо-персонажей</p>
            )}
          </section>

          {similar.length > 0 && (
            <section className="panel">
              <h2>Похожие предметы</h2>
              <ul className="similar">
                {similar.map((other) => (
                  <li key={other.id}>
                    <ItemLink item={other} size={26} />
                    <span className="muted small">{other.ilvl}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
