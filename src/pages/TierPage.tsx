import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta, usePrefetchZone, useZone } from '../data/api.ts';
import { ROLE_ICON } from '../data/art.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, specInfo, zoneTitle } from '../data/specs.ts';
import { scoreZone } from '../data/tiers.ts';
import { formatDateTime, formatPercent } from '../lib/format.ts';
import SpecIcon from '../components/SpecIcon.tsx';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import GameIcon from '../components/GameIcon.tsx';
import PageHero from '../components/PageHero.tsx';
import Segmented from '../components/Segmented.tsx';
import ZoneTabs from '../components/ZoneTabs.tsx';
import TierBoard from '../components/TierBoard.tsx';
import Heatmap from '../components/Heatmap.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

export default function TierPage() {
  const { zoneId } = useParams();
  const { role, stat, update } = useViewParams();
  const meta = useMeta();
  const characters = useCharacters();
  const items = useItems();
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
    const specHref = (s: { cls: string; spec: string }) => link(`/spec/${s.cls}/${s.spec}`, { stat, zone: zone.id });
    const leader = scores.find((s) => !s.sparse);
    body = (
      <div className="stack">
        <section className="panel" aria-labelledby="tier-title">
          <div className="panel__head">
            <h2 id="tier-title" className="panel__title">
              Тир-лист
            </h2>
          </div>
          {leader && (
            <Link to={specHref(leader)} className="reading" viewTransition>
              <span className="reading__value">{formatPercent(leader.score)}</span>
              <span className="reading__who">
                <SpecIcon cls={leader.cls} spec={leader.spec} size={40} />
                <span>
                  <span className="reading__name">
                    {specInfo(leader.cls, leader.spec).name}, {specInfo(leader.cls, leader.spec).clsName.toLowerCase()}
                  </span>
                  <span className="reading__meta"> лучший спек рейда, в среднем от лучшего на {leader.bosses} боссах</span>
                </span>
              </span>
            </Link>
          )}
          <TierBoard scores={scores} specHref={specHref} />
        </section>

        <section className="panel" aria-labelledby="by-boss">
          <div className="panel__head">
            <div>
              <h2 id="by-boss" className="panel__title">
                По боссам
              </h2>
              <p className="panel__hint">Процент от лучшего спека на каждом боссе. Нажми на имя босса, чтобы открыть его рейтинг.</p>
            </div>
          </div>
          <Heatmap zone={zoneData} scores={scores} bossHref={(id) => link(`/raid/${zone.id}/boss/${id}`, { role, stat })} specHref={specHref} />
        </section>
      </div>
    );
  }

  const what = role === 'heal' ? 'лечат больше всех' : role === 'tank' ? 'наносят больше урона среди танков' : 'наносят больше всего урона';

  return (
    <>
      <PageHero
        icon={<GameIcon icon={ROLE_ICON[role]} size={64} letter="T" eager />}
        art={ROLE_ICON[role]}
        title="Тир-лист спеков"
        chips={[title.ru, meta.data.gameVersion]}
        meta={
          <>
            Обновлено: <b>{formatDateTime(meta.data.generatedAt)}</b>
          </>
        }
      >
        <p>
          {title.ru}: какие спеки {what}. Для каждого босса берём {meta.data.topN} лучших парсов каждого спека в Warcraft Logs.
        </p>
        <p className="hub">
          <Link to="/characters">
            <span className="num">{characters.data?.list.length ?? '…'}</span> персонажей с экипировкой
          </Link>
          <Link to="/items">
            <span className="num">{items.data?.db.items.length ?? '…'}</span> предметов из базы Wowhead
          </Link>
        </p>
      </PageHero>

      <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/raid/${id}`, { role, stat })} onIntent={prefetchZone} />

      <div className="controls">
        <Segmented
          label="Роль"
          value={role}
          options={ROLES.map((r) => ({
            value: r,
            label: ROLE_LABEL[r],
            icon: <GameIcon icon={ROLE_ICON[r]} size={16} letter={ROLE_LABEL[r].charAt(0)} eager />,
          }))}
          onChange={(r) => update({ role: r })}
        />
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
