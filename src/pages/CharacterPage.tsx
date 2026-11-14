import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta } from '../data/api.ts';
import { FACTION_LABEL, GEAR_ALL, RACE_LABEL, ROLE_STATS, STAT_LABEL, characterFocus, sumStats } from '../data/items.ts';
import { ROLE_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { formatNumber } from '../lib/format.ts';
import { cssVars, link, usePageTitle } from '../lib/helpers.ts';
import PaperDoll from '../components/PaperDoll.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

function rankClass(r: number) {
  if (r === 1) return 'rank rank--legendary';
  if (r <= 3) return 'rank rank--epic';
  if (r <= 10) return 'rank rank--rare';
  return 'rank';
}

export default function CharacterPage() {
  const { id = '' } = useParams();
  const characters = useCharacters();
  const items = useItems();
  const meta = useMeta();
  const c = characters.data?.byId.get(id);
  usePageTitle(c?.name ?? 'Персонаж');

  // Результаты по рейдам в порядке, в котором рейды и боссы идут в данных
  const results = useMemo(() => {
    if (!c || !meta.data) return [];
    return meta.data.zones
      .map((zone) => ({
        zone,
        rows: zone.encounters
          .map((enc) => ({ enc, parse: c.parses.find((p) => p.z === zone.id && p.e === enc.id) }))
          .filter((r) => r.parse),
      }))
      .filter((z) => z.rows.length);
  }, [c, meta.data]);

  if (characters.isPending || items.isPending) return <Loading />;
  if (characters.isError) return <ErrorState error={characters.error} onRetry={() => void characters.refetch()} />;
  if (items.isError) return <ErrorState error={items.error} onRetry={() => void items.refetch()} />;
  if (!c) {
    return (
      <EmptyState title="Такого персонажа нет">
        <p>
          <Link to="/characters">Все персонажи</Link>
        </p>
      </EmptyState>
    );
  }

  const info = specInfo(c.cls, c.spec);
  const byId = items.data.byId;
  const equipped = GEAR_ALL.map((slot) => {
    const itemId = c.gear[slot];
    return itemId !== null ? byId.get(itemId) : undefined;
  });
  const totals = sumStats(equipped);
  const focus = characterFocus(c);
  const sockets = equipped.reduce((n, item) => n + (item?.sockets?.length ?? 0), 0);
  const unit = info.role === 'heal' ? 'HPS' : 'DPS';

  return (
    <>
      <nav className="crumbs" aria-label="Путь">
        <Link to="/characters">Персонажи</Link>
        <span aria-hidden="true">/</span>
        <span>{c.name}</span>
      </nav>

      <header className="char-hero" style={cssVars({ '--c': info.color })}>
        <SpecIcon cls={c.cls} spec={c.spec} size={72} />
        <div className="char-hero__text">
          <h1 className="char-hero__name">{c.name}</h1>
          <p className="char-hero__line">
            {c.level} ур. · {RACE_LABEL[c.race]} · {info.name}, {info.clsName.toLowerCase()} · {ROLE_LABEL[info.role].toLowerCase()}
          </p>
          <p className="char-hero__tags">
            <span className={`tag tag--${c.faction}`}>{FACTION_LABEL[c.faction]}</span>
            <span className="tag">&lt;{c.guild}&gt;</span>
            <span className="tag">
              {c.realm} · {c.region}
            </span>
            <span className="tag tag--demo">демо-персонаж</span>
          </p>
        </div>
        <div className="char-hero__ilvl">
          <strong>{c.ilvl.toFixed(1)}</strong>
          <span>средний уровень предметов</span>
        </div>
      </header>

      <div style={cssVars({ '--c': info.color })}>
      <PaperDoll character={c} items={byId}>
        <div className="doll-stats">
          <h2>Характеристики</h2>
          <p className="doll-stats__hint">Сумма с надетых предметов, без талантов и баффов</p>
          <dl>
            {ROLE_STATS[focus].map((key) => (
              <div key={key}>
                <dt>{STAT_LABEL[key] ?? 'Броня'}</dt>
                <dd>{formatNumber(totals[key] ?? 0)}</dd>
              </div>
            ))}
            <div>
              <dt>Гнёзд для самоцветов</dt>
              <dd>{sockets}</dd>
            </div>
          </dl>
          <p className="doll-stats__hint">Наведи на предмет, чтобы увидеть подсказку. Нажми, чтобы открыть его страницу.</p>
        </div>
      </PaperDoll>
      </div>

      <section className="block" aria-labelledby="results">
        <div className="block__head">
          <h2 id="results">Результаты в рейдах</h2>
          <p>Место среди игроков роли «{ROLE_LABEL[info.role].toLowerCase()}» на каждом боссе</p>
        </div>
        {results.length === 0 ? (
          <EmptyState title="Пока нет результатов" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Босс</th>
                  <th scope="col" className="r">
                    {unit}
                  </th>
                  <th scope="col" className="r">
                    Место
                  </th>
                  <th scope="col">Лучше, чем</th>
                </tr>
              </thead>
              {results.map(({ zone, rows }) => (
                <tbody key={zone.id}>
                  <tr className="table__group">
                    <th scope="rowgroup" colSpan={4}>
                      {zoneTitle(zone.name).ru}
                    </th>
                  </tr>
                  {rows.map(({ enc, parse }) => {
                    const p = parse!;
                    const better = p.n > 1 ? (p.n - p.r) / (p.n - 1) : 1;
                    return (
                      <tr key={enc.id}>
                        <td>
                          <Link to={link(`/raid/${zone.id}/boss/${enc.id}`, { role: info.role })}>{enc.name}</Link>
                        </td>
                        <td className="r strong">{formatNumber(p.a)}</td>
                        <td className={`r ${rankClass(p.r)}`}>
                          {p.r} из {p.n}
                        </td>
                        <td>
                          <span className="mini" style={cssVars({ '--c': info.color, '--w': `${Math.round(better * 100)}%` })}>
                            <span className="mini__track" aria-hidden="true">
                              <span className="mini__fill" />
                            </span>
                            <span className="mini__value">{Math.round(better * 100)}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </section>
    </>
  );
}
