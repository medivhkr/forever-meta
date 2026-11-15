import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta } from '../data/api.ts';
import { FOCUS_LABEL, bossKey, itemFocus, wowheadUrl } from '../data/items.ts';
import { specInfo, zoneTitle } from '../data/specs.ts';
import { plural } from '../lib/format.ts';
import { usePageTitle } from '../lib/helpers.ts';
import BackLink from '../components/BackLink.tsx';
import CharacterName from '../components/CharacterName.tsx';
import ItemIcon from '../components/ItemIcon.tsx';
import ItemLink from '../components/ItemLink.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

// Страница предмета устроена как «Технические характеристики» на сайте Apple:
// слева название раздела, справа содержимое, разделы разделены тонкими линиями.
function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="specs__row">
      <h2 className="specs__title">{title}</h2>
      <div className="specs__body">{children}</div>
    </section>
  );
}

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
  const kind = item.typeRu ? `${item.slotRu}, ${item.typeRu.toLowerCase()}` : item.slotRu;

  return (
    <>
      <BackLink to="/items">Предметы</BackLink>

      <header className="hero" data-q={item.q}>
        <ItemIcon item={item} size={96} vt />
        <div className="hero__text">
          <h1 className="hero__title hero__title--item">{item.name}</h1>
          <p className="hero__sub">
            {kind}. Уровень предмета {item.ilvl}.
          </p>
          <p className="hero__en" lang="en">
            {item.nameEn}
          </p>
        </div>
      </header>

      <div className="specs">
        <Row title="Основное">
          <ul className="lines">
            {item.bind && <li>{item.bind}</li>}
            {item.unique && <li>Уникальный</li>}
            {item.armor !== undefined && <li>Броня: {item.armor}</li>}
            {item.dmg && (
              <li>
                Урон: {item.dmg[0]}–{item.dmg[1]}
                {item.speed !== undefined ? `, скорость ${item.speed.toFixed(2).replace('.', ',')}` : ''}
                {item.dps !== undefined ? ` (${item.dps.toFixed(1).replace('.', ',')} ед. урона в секунду)` : ''}
              </li>
            )}
            {item.classes && <li>Классы: {item.classes}</li>}
            <li>Требуется 70-й уровень</li>
            {item.phase && <li>Появляется в {item.phase}-й фазе</li>}
            <li>Подходит: {FOCUS_LABEL[itemFocus(item)].toLowerCase()}</li>
          </ul>
        </Row>

        {item.statLines.length > 0 && (
          <Row title="Характеристики">
            <ul className="lines lines--strong">
              {item.statLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Row>
        )}

        {item.socketsRu && item.socketsRu.length > 0 && (
          <Row title="Гнёзда">
            <ul className="lines">
              {item.socketsRu.map((socket, i) => (
                <li key={`${socket}-${i}`} className="wtt__socket" data-socket={item.sockets?.[i]}>
                  {socket}
                </li>
              ))}
              {item.socketBonus && <li className="muted">{item.socketBonus}</li>}
            </ul>
          </Row>
        )}

        {item.effects && item.effects.length > 0 && (
          <Row title="Эффекты">
            <ul className="lines">
              {item.effects.map((effect) => (
                <li key={effect} className="text-good">
                  {effect}
                </li>
              ))}
            </ul>
          </Row>
        )}

        {item.set && (
          <Row title="Комплект">
            <p className="lines__head">
              {item.set.name}, {item.set.size} {plural(item.set.size, 'предмет', 'предмета', 'предметов')}
            </p>
            <ul className="lines">
              {item.set.bonuses.map((bonus) => (
                <li key={bonus} className="muted">
                  {bonus}
                </li>
              ))}
            </ul>
          </Row>
        )}

        <Row title="Где достать">
          <p className="lines__head">
            {bossLink ? (
              <Link to={bossLink} viewTransition>
                {item.boss}
              </Link>
            ) : (
              item.boss
            )}
          </p>
          {zoneName && <p className="muted">{zoneTitle(zoneName).ru}</p>}
          <p className="lines__more">
            <a href={wowheadUrl(item.id)} target="_blank" rel="noreferrer">
              Открыть на Wowhead ↗
            </a>
          </p>
        </Row>

        <Row title="Кто носит">
          {wearers.length ? (
            <ul className="people">
              {wearers.map((c) => {
                const info = specInfo(c.cls, c.spec);
                return (
                  <li key={c.id}>
                    <SpecIcon cls={c.cls} spec={c.spec} size={32} />
                    <span className="player__text">
                      <CharacterName id={c.id} name={c.name} />
                      <span className="player__sub">
                        {info.name}, {info.clsName.toLowerCase()}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Никто из демо-персонажей</p>
          )}
        </Row>

        {similar.length > 0 && (
          <Row title="Похожие предметы">
            <ul className="similar">
              {similar.map((other) => (
                <li key={other.id}>
                  <ItemLink item={other} size={32} />
                  <span className="muted small">{other.ilvl}</span>
                </li>
              ))}
            </ul>
          </Row>
        )}
      </div>
    </>
  );
}
