import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMeta, useZone } from '../data/api.ts';
import { ROLE_LABEL, STATS, STAT_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { TIERS, rankEncounter, scoreZone } from '../data/tiers.ts';
import { formatNumber, formatPercent } from '../lib/format.ts';
import { cssVars, link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import Segmented from '../components/Segmented.tsx';
import SpecIcon from '../components/SpecIcon.tsx';
import ZoneTabs from '../components/ZoneTabs.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

export default function SpecPage() {
  const { cls = '', spec = '' } = useParams();
  const [params] = useSearchParams();
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
      <nav className="crumbs" aria-label="Путь">
        <Link to={link(`/raid/${zone.id}`, { role: info.role, stat })}>Тир-лист: {title.ru}</Link>
        <span aria-hidden="true">/</span>
        <span>{info.name}</span>
      </nav>

      <header className="spec-hero" style={cssVars({ '--c': info.color })}>
        <SpecIcon cls={cls} spec={spec} size={64} />
        <div className="spec-hero__text">
          <p className="eyebrow">
            {info.clsName} · {ROLE_LABEL[info.role].toLowerCase()}
          </p>
          <h1 className="spec-hero__title">{info.name}</h1>
          {mine && tier ? (
            <p className="spec-hero__sub">
              <span className="tier-badge" style={cssVars({ '--q': tier.color })} title={`Тир ${tier.id}, ${tier.label}`}>
                {tier.id}
              </span>
              <span>
                {place}-е место из {scores.length} в рейде «{title.ru}». В среднем {formatPercent(mine.score)} от лучшего спека.
              </span>
            </p>
          ) : (
            <p className="spec-hero__sub muted">В этом рейде у спека нет данных.</p>
          )}
        </div>
      </header>

      <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/spec/${cls}/${spec}`, { stat, zone: id })} />

      <div className="toolbar">
        <Segmented
          label="Метрика"
          value={stat}
          options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
          onChange={(s) => update({ stat: s })}
        />
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
                      <Link to={link(`/raid/${zone.id}/boss/${enc.id}`, { role: info.role, stat })}>{enc.name}</Link>
                    </td>
                    <td className="r strong">{row ? formatNumber(row.value) : '—'}</td>
                    <td>
                      {row ? (
                        <span className="mini" style={cssVars({ '--c': info.color, '--w': `${(row.rel * 100).toFixed(1)}%` })}>
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
                        <span className="spec-label" style={cssVars({ '--c': bestInfo.color })}>
                          <SpecIcon cls={bestInfo.cls} spec={bestInfo.spec} size={20} />
                          <span className="spec-label__name">{bestInfo.name}</span>
                          <span className="spec-label__cls">{bestInfo.clsName}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="muted">{top ? `${top.name} · ${formatNumber(top.amount)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
