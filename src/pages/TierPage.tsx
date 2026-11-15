import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useMeta, usePrefetchZone, useZone } from '../data/api.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, zoneTitle } from '../data/specs.ts';
import { scoreZone } from '../data/tiers.ts';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import Segmented from '../components/Segmented.tsx';
import ZoneTabs from '../components/ZoneTabs.tsx';
import TierBoard from '../components/TierBoard.tsx';
import Heatmap, { HeatLegend } from '../components/Heatmap.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

export default function TierPage() {
  const { zoneId } = useParams();
  const { role, stat, update } = useViewParams();
  const meta = useMeta();
  const zones = meta.data?.zones ?? [];
  // Без id в адресе показываем самый свежий рейд: сборщик кладёт его первым
  const zone = zoneId ? zones.find((z) => String(z.id) === zoneId) : zones[0];
  const zoneQuery = useZone(zone?.id, meta.data?.generatedAt);
  const zoneData = zoneQuery.data;
  const prefetchZone = usePrefetchZone(meta.data?.generatedAt);

  // Пересчитываем тиры, только когда поменялись данные, роль или метрика
  const scores = useMemo(() => (zoneData ? scoreZone(zoneData, role, stat) : []), [zoneData, role, stat]);

  const title = zone ? zoneTitle(zone.name) : undefined;
  usePageTitle(title ? `Тир-лист: ${title.ru}` : 'Тир-лист');

  if (meta.isPending) return <Loading />;
  if (meta.isError) return <ErrorState error={meta.error} onRetry={() => void meta.refetch()} />;
  if (!zone || !title) {
    return (
      <EmptyState title={zoneId ? 'Такого рейда нет' : 'Данных пока нет'}>
        {zoneId ? (
          <p>
            <Link to="/">Открыть тир-лист последнего рейда</Link>
          </p>
        ) : (
          <p>Сборщик ещё не записал ни одного рейда.</p>
        )}
      </EmptyState>
    );
  }

  let body: ReactNode;
  if (zoneQuery.isPending) {
    body = <Loading />;
  } else if (zoneQuery.isError) {
    body = <ErrorState error={zoneQuery.error} onRetry={() => void zoneQuery.refetch()} />;
  } else if (!zoneData || scores.length === 0) {
    body = (
      <EmptyState title="По этой роли данных нет">
        <p>В рейде «{title.ru}» Warcraft Logs не набрал достаточно парсов для роли «{ROLE_LABEL[role].toLowerCase()}».</p>
      </EmptyState>
    );
  } else {
    body = (
      <>
        <TierBoard scores={scores} specHref={(s) => link(`/spec/${s.cls}/${s.spec}`, { stat, zone: zone.id })} />
        <section className="section" aria-labelledby="by-boss">
          <div className="section__head">
            <div>
              <h2 id="by-boss" className="section__title">
                По боссам
              </h2>
              <p className="section__sub">Сколько процентов от лучшего спека набирает каждый спек. Нажми на босса, чтобы открыть его рейтинг.</p>
            </div>
            <HeatLegend />
          </div>
          <Heatmap
            zone={zoneData}
            scores={scores}
            bossHref={(id) => link(`/raid/${zone.id}/boss/${id}`, { role, stat })}
            specHref={(s) => link(`/spec/${s.cls}/${s.spec}`, { stat, zone: zone.id })}
          />
        </section>
      </>
    );
  }

  const what = role === 'heal' ? 'лечат больше всех' : role === 'tank' ? 'из танков наносят больше урона' : 'наносят больше всего урона';

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Тир-лист</h1>
        <p className="page-sub">
          Какие спеки {what} в рейде «{title.ru}». Считаем по {meta.data.topN} лучшим логам каждого спека на каждом боссе,{' '}
          {meta.data.gameVersion}.
        </p>
      </header>

      <div className="controls">
        <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/raid/${id}`, { role, stat })} onIntent={prefetchZone} />
        <div className="controls__row">
          <Segmented
            label="Роль"
            value={role}
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            onChange={(r) => update({ role: r })}
          />
          <Segmented
            label="Метрика"
            value={stat}
            options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
            onChange={(s) => update({ stat: s })}
          />
        </div>
      </div>

      {body}
    </>
  );
}
