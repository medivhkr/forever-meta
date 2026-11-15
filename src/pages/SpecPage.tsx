import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMeta, useZone } from '../data/api.ts';
import { ROLE_LABEL, STATS, STAT_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { TIERS, rankEncounter, scoreZone } from '../data/tiers.ts';
import { formatNumber, formatPercent } from '../lib/format.ts';
import { cssVars, link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import BackLink from '../components/BackLink.tsx';
import RadarChart from '../components/RadarChart.tsx';
import Segmented from '../components/Segmented.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import ZoneTabs from '../components/ZoneTabs.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

export default function SpecPage() {
  const { cls = '', spec = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { stat, update } = useViewParams();
  const meta = useMeta();
  const zones = meta.data?.zones ?? [];
  const zone = zones.find((z) => String(z.id) === params.get('zone')) ?? zones[0];
  const zoneQuery = useZone(zone?.id, meta.data?.generatedAt);
  const zoneData = zoneQuery.data;
  const info = specInfo(cls, spec);

  const scores = useMemo(() => (zoneData ? scoreZone(zoneData, info.role, stat) : []), [zoneData, info.role, stat]);

  // Для каждого босса: место спека, его значение и лучший спек на этом боссе
  const rows = useMemo(() => {
    if (!zoneData) return [];
    return zoneData.encounters.map((enc) => {
      const ranked = rankEncounter(enc, info.role, stat);
      const mine = ranked.find((r) => r.stats.cls === cls && r.stats.spec === spec);
      return { enc, mine, best: ranked[0], total: ranked.length };
    });
  }, [zoneData, info.role, stat, cls, spec]);

  // С кем сравнивать на радаре: из адреса (?vs=mage/fire) или лучший другой спек этой роли
  const others = scores.filter((s) => !(s.cls === cls && s.spec === spec));
  const vsKey = params.get('vs');
  const rival = others.find((s) => `${s.cls}/${s.spec}` === vsKey) ?? others[0];

  // Цвета двух серий постоянные (синий и оранжевый, проверены на различимость при дальтонизме),
  // а не цвета классов: у мага и мага они совпали бы, а жёлтый разбойника не виден на белом.
  const radar = useMemo(() => {
    if (!zoneData || zoneData.encounters.length < 3) return null;
    const relOf = (c: string, s: string) =>
      zoneData.encounters.map((enc) => rankEncounter(enc, info.role, stat).find((r) => r.stats.cls === c && r.stats.spec === s)?.rel ?? null);
    const series = [{ label: `${info.name}, ${info.clsName.toLowerCase()}`, color: 'var(--series-1)', values: relOf(cls, spec) }];
    if (rival) {
      const ri = specInfo(rival.cls, rival.spec, rival.metric);
      series.push({ label: `${ri.name}, ${ri.clsName.toLowerCase()}`, color: 'var(--series-2)', values: relOf(rival.cls, rival.spec) });
    }
    return { axes: zoneData.encounters.map((enc) => enc.name), series };
  }, [zoneData, info, stat, cls, spec, rival]);

  usePageTitle(`${info.name}, ${info.clsName.toLowerCase()}`);

  if (meta.isPending) return <Loading />;
  if (meta.isError) return <ErrorState error={meta.error} onRetry={() => void meta.refetch()} />;
  if (!zone) return <EmptyState title="Данных пока нет" />;

  const title = zoneTitle(zone.name);
  const mine = scores.find((s) => s.cls === cls && s.spec === spec);
  const place = mine ? scores.indexOf(mine) + 1 : 0;
  const tier = mine ? TIERS.find((t) => t.id === mine.tier) : undefined;
  const unit = info.role === 'heal' ? 'HPS' : 'DPS';

  return (
    <>
      <BackLink to={link(`/raid/${zone.id}`, { role: info.role, stat })}>Тир-лист</BackLink>

      <header className="hero">
        <SpecIcon cls={cls} spec={spec} size={96} vt={`spec-${cls}-${spec}`} />
        <div className="hero__text">
          <h1 className="hero__title">{info.name}</h1>
          <p className="hero__sub">
            {info.clsName}, {ROLE_LABEL[info.role].toLowerCase()}
          </p>
        </div>
      </header>

      {mine && tier ? (
        <p className="lead">
          <span className="tier-badge" style={cssVars({ '--q': tier.color })} title={`Тир ${tier.id}, ${tier.label}`}>
            {tier.id}
          </span>
          <span>
            {place}-е место из {scores.length} в рейде «{title.ru}». В среднем {formatPercent(mine.score)} от лучшего спека на каждом боссе.
          </span>
        </p>
      ) : (
        <p className="lead muted">В рейде «{title.ru}» у этого спека нет данных.</p>
      )}

      <div className="controls">
        <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/spec/${cls}/${spec}`, { stat, zone: id })} />
        <div className="controls__row">
          <Segmented
            label="Метрика"
            value={stat}
            options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
            onChange={(s) => update({ stat: s })}
          />
        </div>
      </div>

      {radar && (
        <section className="section" aria-labelledby="radar-title">
          <div className="section__head">
            <div>
              <h2 id="radar-title" className="section__title">
                Профиль по боссам
              </h2>
              <p className="section__sub">Чем дальше точка от центра, тем ближе спек к лучшему на этом боссе.</p>
            </div>
            {others.length > 0 && rival && (
              <label className="field">
                <span className="field__label">Сравнить с</span>
                <select
                  id="spec-compare"
                  className="input input--select"
                  value={`${rival.cls}/${rival.spec}`}
                  onChange={(e) =>
                    setParams(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('vs', e.target.value);
                        return next;
                      },
                      { replace: true, preventScrollReset: true },
                    )
                  }
                >
                  {others.map((s) => {
                    const si = specInfo(s.cls, s.spec, s.metric);
                    return (
                      <option key={`${s.cls}/${s.spec}`} value={`${s.cls}/${s.spec}`}>
                        {si.name}, {si.clsName.toLowerCase()} ({formatPercent(s.score)})
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
          </div>
          <RadarChart axes={radar.axes} series={radar.series} title={`Доля от лучшего спека на каждом боссе рейда «${title.ru}»`} />
        </section>
      )}

      <section className="section" aria-labelledby="per-boss">
        <div className="section__head">
          <h2 id="per-boss" className="section__title">
            На каждом боссе
          </h2>
        </div>
        {zoneQuery.isPending ? (
          <Loading />
        ) : zoneQuery.isError ? (
          <ErrorState error={zoneQuery.error} onRetry={() => void zoneQuery.refetch()} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Босс</th>
                  <th scope="col" className="r">
                    {unit}
                  </th>
                  <th scope="col">От лучшего</th>
                  <th scope="col" className="r">
                    Место
                  </th>
                  <th scope="col">Лучший на боссе</th>
                  <th scope="col">Лучший игрок спека</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ enc, mine: row, best, total }) => {
                  const bestInfo = best ? specInfo(best.stats.cls, best.stats.spec, best.stats.metric) : undefined;
                  const top = row?.stats.players[0];
                  return (
                    <tr key={enc.id}>
                      <td>
                        <Link to={link(`/raid/${zone.id}/boss/${enc.id}`, { role: info.role, stat })} viewTransition>
                          {enc.name}
                        </Link>
                      </td>
                      <td className="r strong">{row ? formatNumber(row.value) : '—'}</td>
                      <td>
                        {row ? (
                          <span className="mini" style={cssVars({ '--w': `${(row.rel * 100).toFixed(1)}%` })}>
                            <span className="mini__track" aria-hidden="true">
                              <span className="mini__fill" />
                            </span>
                            <span className="mini__value">{formatPercent(row.rel)}</span>
                          </span>
                        ) : (
                          <span className="muted">нет данных</span>
                        )}
                      </td>
                      <td className="r muted">{row ? `${row.rank} из ${total}` : '—'}</td>
                      <td>
                        {bestInfo ? (
                          <span className="spec-label">
                            <SpecIcon cls={bestInfo.cls} spec={bestInfo.spec} size={24} />
                            <span className="spec-label__name">{bestInfo.name}</span>
                            <span className="spec-label__cls">{bestInfo.clsName}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="muted">{top ? `${top.name}, ${formatNumber(top.amount)}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
