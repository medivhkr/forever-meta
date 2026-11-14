import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useCharacters, useItems, useMeta, useZone } from '../data/api.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, zoneTitle } from '../data/specs.ts';
import { scoreZone } from '../data/tiers.ts';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
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
        <section className="block" aria-labelledby="by-boss">
          <div className="block__head">
            <h2 id="by-boss">По боссам</h2>
            <p>Процент от лучшего спека на каждом боссе. Нажми на имя босса, чтобы открыть его рейтинг.</p>
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

  const what = role === 'heal' ? 'лечат больше всех' : role === 'tank' ? 'наносят больше урона среди танков' : 'наносят больше всего урона';

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{meta.data.gameVersion} · рейды</p>
        <h1 className="page-title">Тир-лист спеков</h1>
        <p className="page-sub">
          {title.ru}: какие спеки {what}. Для каждого босса берём {meta.data.topN} лучших парсов каждого спека в Warcraft Logs.
        </p>
        <div className="hub">
          <Link to="/characters">
            <span className="hub__num">{characters.data?.list.length ?? '…'}</span>
            персонажей с экипировкой
          </Link>
          <Link to="/items">
            <span className="hub__num">{items.data?.db.items.length ?? '…'}</span>
            предметов из базы Wowhead
          </Link>
        </div>
      </header>

      <ZoneTabs zones={zones} activeId={zone.id} hrefFor={(id) => link(`/raid/${id}`, { role, stat })} />

      <div className="toolbar">
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

      {body}
    </>
  );
}
