import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMeta, useZone } from '../data/api.ts';
import { ROLE_LABEL, STATS, STAT_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { TIERS, rankEncounter, scoreZone } from '../data/tiers.ts';
import { formatDateTime, formatNumber, formatPercent } from '../lib/format.ts';
import { cssVars, link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import BackLink from '../components/BackLink.tsx';
import { heat } from '../components/Heatmap.tsx';
import PageHero from '../components/PageHero.tsx';
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

  const parses = rows.reduce((n, r) => n + (r.mine?.stats.count ?? 0), 0);

  // С кем сравнивать на радаре: из адреса (?vs=mage/fire) или лучший другой спек этой роли
  const others = scores.filter((s) => !(s.cls === cls && s.spec === spec));
  const vsKey = params.get('vs');
  const rival = others.find((s) => `${s.cls}/${s.spec}` === vsKey) ?? others[0];

  const radar = useMemo(() => {
    if (!zoneData || zoneData.encounters.length < 3) return null;
    const relOf = (c: string, s: string) =>
      zoneData.encounters.map((enc) => rankEncounter(enc, info.role, stat).find((r) => r.stats.cls === c && r.stats.spec === s)?.rel ?? null);
    const series = [{ label: `${info.name}, ${info.clsName.toLowerCase()}`, color: info.color, values: relOf(cls, spec) }];
    if (rival) {
      const ri = specInfo(rival.cls, rival.spec, rival.metric);
      // Если у соперника тот же цвет класса (маг против мага), берём нейтральный
      series.push({ label: `${ri.name}, ${ri.clsName.toLowerCase()}`, color: ri.color === info.color ? '#9aa6b8' : ri.color, values: relOf(rival.cls, rival.spec) });
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
      <BackLink to={link(`/raid/${zone.id}`, { role: info.role, stat })}>Тир-лист: {title.ru}</BackLink>

      <PageHero
        icon={<SpecIcon cls={cls} spec={spec} size={64} vt={`spec-${cls}-${spec}`} />}
        art={info.icon}
        title={`${info.name}, ${info.clsName.toLowerCase()}`}
        titleColor={info.color}
        chips={[title.ru, ROLE_LABEL[info.role], meta.data.gameVersion]}
        meta={
          <>
            Обновлено: <b>{formatDateTime(meta.data.generatedAt)}</b>
          </>
        }
      >
        {mine && tier ? (
          <p className="tier-line">
            <span className="tier-badge" style={cssVars({ '--tc': tier.color })} title={`Тир ${tier.id}, ${tier.label}`}>
              {tier.id}
            </span>
            <span>
              <span className="num">{place}-е место</span> из {scores.length} в рейде «{title.ru}», в среднем{' '}
              <span className="num">{formatPercent(mine.score)}</span> от лучшего спека. Основано на{' '}
              <span className="num">{formatNumber(parses)} парсах</span>.
            </span>
          </p>
        ) : (
          <p>В рейде «{title.ru}» у этого спека нет данных.</p>
        )}
      </PageHero>

      <div className="controls">
        <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/spec/${cls}/${spec}`, { stat, zone: id })} />
        <Segmented
          label="Метрика"
          value={stat}
          options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
          onChange={(s) => update({ stat: s })}
        />
      </div>

      <div className="stack">
        {radar && (
          <section className="panel" aria-labelledby="radar-title">
            <div className="panel__head">
              <div>
                <h2 id="radar-title" className="panel__title">
                  Профиль по боссам
                </h2>
                <p className="panel__hint">Чем дальше точка от центра, тем ближе спек к лучшему на этом боссе.</p>
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
            <div className="panel__body">
              <RadarChart axes={radar.axes} series={radar.series} title={`Доля от лучшего спека на каждом боссе рейда «${title.ru}»`} />
            </div>
          </section>
        )}

        <section className="panel" aria-labelledby="per-boss">
          <div className="panel__head">
            <div>
              <h2 id="per-boss" className="panel__title">
                На каждом боссе
              </h2>
              <p className="panel__hint">{STAT_LABEL[stat].long} этого спека и лучший спек на каждом боссе.</p>
            </div>
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
                    <th scope="col" className="r">
                      От лучшего
                    </th>
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
                        {row ? (
                          <td className="r cell-heat" style={cssVars({ '--p': heat(row.rel) })}>
                            {formatPercent(row.rel)}
                          </td>
                        ) : (
                          <td className="r cell-none">—</td>
                        )}
                        <td className="r muted">{row ? `${row.rank} из ${total}` : '—'}</td>
                        <td>
                          {bestInfo ? (
                            <span className="spec-label" style={cssVars({ '--c': bestInfo.color })}>
                              <SpecIcon cls={bestInfo.cls} spec={bestInfo.spec} size={20} />
                              <span className="spec-label__name">
                                {bestInfo.name} {bestInfo.clsName.toLowerCase()}
                              </span>
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
      </div>
    </>
  );
}
