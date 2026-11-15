import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta } from '../data/api.ts';
import { FOCUS_LABEL, bossKey, itemFocus, wowheadUrl } from '../data/items.ts';
import { specInfo, zoneTitle } from '../data/specs.ts';
import { usePageTitle } from '../lib/helpers.ts';
import BackLink from '../components/BackLink.tsx';
import CharacterName from '../components/CharacterName.tsx';
import ItemIcon from '../components/ItemIcon.tsx';
import ItemLink from '../components/ItemLink.tsx';
import ItemTooltip from '../components/ItemTooltip.tsx';
import PageHero from '../components/PageHero.tsx';
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
  const raid = zoneName ? zoneTitle(zoneName).ru : null;
  const chips = [item.typeRu ? `${item.slotRu}, ${item.typeRu.toLowerCase()}` : item.slotRu, `Уровень предмета ${item.ilvl}`];
  if (raid) chips.push(raid);
  if (item.phase) chips.push(`${item.phase}-я фаза`);

  return (
    <>
      <BackLink to="/items">База предметов</BackLink>

      <PageHero
        icon={<ItemIcon item={item} size={64} vt />}
        art={item.icon}
        title={item.name}
        titleColor={`var(--q${item.q})`}
        chips={chips}
        meta={
          <>
            Добыча: <b>{item.boss}</b>. <span lang="en">{item.nameEn}</span>
          </>
        }
      />

      <div className="item-layout">
        <section className="panel" aria-labelledby="tooltip-title">
          <div className="panel__head">
            <h2 id="tooltip-title" className="panel__title">
              Подсказка в игре
            </h2>
            <a className="link-more" href={wowheadUrl(item.id)} target="_blank" rel="noreferrer">
              Открыть на Wowhead ↗
            </a>
          </div>
          <div className="panel__body">
            <ItemTooltip item={item} large />
          </div>
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Где достать</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Босс</th>
                    <th scope="col">Рейд</th>
                    <th scope="col">Подходит</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {bossLink ? (
                        <Link to={bossLink} viewTransition>
                          {item.boss}
                        </Link>
                      ) : (
                        item.boss
                      )}
                    </td>
                    <td className="muted">{raid ?? '—'}</td>
                    <td className="muted">{FOCUS_LABEL[itemFocus(item)]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Кто носит</h2>
                <p className="panel__hint">Демо-персонажи с этим предметом</p>
              </div>
            </div>
            {wearers.length ? (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {wearers.map((c) => {
                      const info = specInfo(c.cls, c.spec);
                      return (
                        <tr key={c.id}>
                          <td>
                            <span className="player">
                              <SpecIcon cls={c.cls} spec={c.spec} size={24} />
                              <CharacterName id={c.id} name={c.name} cls={c.cls} />
                            </span>
                          </td>
                          <td className="muted">
                            {info.name}, {info.clsName.toLowerCase()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="panel__body muted">Никто из демо-персонажей</p>
            )}
          </section>

          {similar.length > 0 && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Похожие предметы</h2>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Предмет</th>
                      <th scope="col" className="r">
                        Уровень
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {similar.map((other) => (
                      <tr key={other.id}>
                        <td className="cell-wrap">
                          <ItemLink item={other} size={22} />
                        </td>
                        <td className="r strong">{other.ilvl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
