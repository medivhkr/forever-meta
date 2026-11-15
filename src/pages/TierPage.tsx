import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useMeta, usePrefetchZone, useZone } from '../data/api.ts';
import { ROLE_ICON } from '../data/art.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { MIN_PARSES, scoreZone } from '../data/tiers.ts';
import { formatDateTime, formatNumber } from '../lib/format.ts';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import Explain from '../components/Explain.tsx';
import GameIcon from '../components/GameIcon.tsx';
import PageHero from '../components/PageHero.tsx';
import Segmented from '../components/Segmented.tsx';
import ZoneTabs from '../components/ZoneTabs.tsx';
import TierBoard from '../components/TierBoard.tsx';
import Heatmap from '../components/Heatmap.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

const ROLE_TITLE = { dps: 'урона', heal: 'лечения', tank: 'танков' } as const;

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

  // Сколько парсов этой роли легло в основу тир-листа
  const records = useMemo(() => {
    if (!zoneData) return 0;
    let total = 0;
    for (const enc of zoneData.encounters) {
      for (const s of enc.specs) if (specInfo(s.cls, s.spec, s.metric).role === role) total += s.count;
    }
    return total;
  }, [zoneData, role]);

  const title = zone ? zoneTitle(zone.name) : undefined;
  usePageTitle(title ? `Тир-лист ${ROLE_TITLE[role]}: ${title.ru}` : 'Тир-лист');

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
    const specHref = (s: { cls: string; spec: string }) => link(`/spec/${s.cls}/${s.spec}`, { stat, zone: zone.id });
    body = (
      <div className="stack">
        <section className="panel" aria-labelledby="tier-title">
          <div className="panel__head">
            <div>
              <h2 id="tier-title" className="panel__title">
                Тир-лист {ROLE_TITLE[role]}
              </h2>
              <p className="panel__sub">
                Данные по: <span className="num">{formatNumber(records)} парсов</span>
              </p>
              <p className="panel__hint">Нажми на спек, чтобы открыть его разбор по боссам</p>
            </div>
          </div>
          <TierBoard scores={scores} specHref={specHref} />
        </section>

        <section className="panel" aria-labelledby="rank-title">
          <div className="panel__head">
            <div>
              <h2 id="rank-title" className="panel__title">
                Рейтинг по боссам
              </h2>
              <p className="panel__hint">Процент от лучшего спека на каждом боссе. Нажми на босса, чтобы открыть его рейтинг.</p>
            </div>
          </div>
          <Heatmap zone={zoneData} scores={scores} bossHref={(id) => link(`/raid/${zone.id}/boss/${id}`, { role, stat })} specHref={specHref} />
        </section>
      </div>
    );
  }

  return (
    <>
      <PageHero
        icon={<GameIcon icon={ROLE_ICON[role]} size={64} letter="T" eager />}
        art={ROLE_ICON[role]}
        title={`Тир-лист ${ROLE_TITLE[role]}: ${title.ru}`}
        chips={[title.ru, meta.data.gameVersion]}
        meta={
          <>
            Обновлено: <b>{formatDateTime(meta.data.generatedAt)}</b>
          </>
        }
      >
        <p>
          Какие спеки сильнее всего в {meta.data.gameVersion}: по {meta.data.topN} лучшим логам каждого спека на каждом боссе из
          публичного <b>API Warcraft Logs</b>.
        </p>
      </PageHero>

      <Explain>
        <ol>
          <li>На каждом боссе берём выбранную метрику спека, по умолчанию медиану {meta.data.topN} лучших парсов.</li>
          <li>Делим её на значение лучшего спека этой роли на том же боссе и получаем долю от 0 до 100%.</li>
          <li>Усредняем доли по всем боссам рейда. Тир: S от 97%, A от 92%, B от 85%, C от 75%, D ниже.</li>
          <li>
            Спек с меньше чем {MIN_PARSES} парсами на боссе там не учитывается. Если он есть меньше чем на половине боссов, он попадает в
            ряд X.
          </li>
        </ol>
      </Explain>

      <Segmented
        variant="tabs"
        label="Роль"
        value={role}
        options={ROLES.map((r) => ({
          value: r,
          label: ROLE_LABEL[r],
          icon: <GameIcon icon={ROLE_ICON[r]} size={18} letter={ROLE_LABEL[r].charAt(0)} eager />,
        }))}
        onChange={(r) => update({ role: r })}
      />

      <div className="controls">
        <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/raid/${id}`, { role, stat })} onIntent={prefetchZone} />
        <Segmented
          label="Метрика"
          value={stat}
          options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
          onChange={(s) => update({ stat: s })}
        />
      </div>

      {body}
    </>
  );
}
