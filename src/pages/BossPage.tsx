import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useMeta, useZone } from '../data/api.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, zoneTitle } from '../data/specs.ts';
import { rankEncounter, topPlayers } from '../data/tiers.ts';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import Segmented from '../components/Segmented.tsx';
import SpecBars from '../components/SpecBars.tsx';
import PlayersTable from '../components/PlayersTable.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

type Tab = 'specs' | 'players';

export default function BossPage() {
  const { zoneId, encounterId } = useParams();
  const { role, stat, update } = useViewParams();
  const [tab, setTab] = useState<Tab>('specs');
  const meta = useMeta();
  const zone = meta.data?.zones.find((z) => String(z.id) === zoneId);
  const zoneQuery = useZone(zone?.id, meta.data?.generatedAt);
  const encounter = zoneQuery.data?.encounters.find((e) => String(e.id) === encounterId);

  const rows = useMemo(() => (encounter ? rankEncounter(encounter, role, stat) : []), [encounter, role, stat]);
  const players = useMemo(() => (encounter ? topPlayers(encounter, role) : []), [encounter, role]);

  usePageTitle(encounter?.name);

  if (meta.isPending || (zone && zoneQuery.isPending)) return <Loading />;
  if (meta.isError) return <ErrorState error={meta.error} onRetry={() => void meta.refetch()} />;
  if (zoneQuery.isError) return <ErrorState error={zoneQuery.error} onRetry={() => void zoneQuery.refetch()} />;
  if (!zone || !encounter) {
    return (
      <EmptyState title="Такого босса нет">
        <p>
          <Link to="/">Вернуться к тир-листу</Link>
        </p>
      </EmptyState>
    );
  }

  const title = zoneTitle(zone.name);
  const index = zone.encounters.findIndex((e) => e.id === encounter.id);
  const prev = zone.encounters[index - 1];
  const next = zone.encounters[index + 1];
  const unit = role === 'heal' ? 'HPS' : 'DPS';
  const specHref = (cls: string, spec: string) => link(`/spec/${cls}/${spec}`, { stat, zone: zone.id });

  let panel: ReactNode;
  if (tab === 'specs') {
    panel = rows.length ? (
      <SpecBars rows={rows} specHref={specHref} />
    ) : (
      <EmptyState title="По этой роли данных нет" />
    );
  } else {
    panel = players.length ? (
      <PlayersTable players={players} site={meta.data.site} unit={unit} />
    ) : (
      <EmptyState title="По этой роли данных нет" />
    );
  }

  return (
    <>
      <nav className="crumbs" aria-label="Путь">
        <Link to={link(`/raid/${zone.id}`, { role, stat })}>{title.ru}</Link>
        <span aria-hidden="true">/</span>
        <span>{encounter.name}</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">
          {meta.data.gameVersion} · босс {index + 1} из {zone.encounters.length}
        </p>
        <h1 className="page-title">{encounter.name}</h1>
        <p className="page-sub">
          {title.ru}. {tab === 'specs' ? `${STAT_LABEL[stat].long} каждого спека, ${unit}.` : `Лучшие ${unit} среди всех спеков роли «${ROLE_LABEL[role].toLowerCase()}».`}
        </p>
      </header>

      <div className="toolbar">
        <Segmented
          label="Роль"
          value={role}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
          onChange={(r) => update({ role: r })}
        />
        {tab === 'specs' && (
          <Segmented
            label="Метрика"
            value={stat}
            options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
            onChange={(s) => update({ stat: s })}
          />
        )}
      </div>

      <div className="tabs" role="tablist" aria-label="Вид">
        <button type="button" role="tab" id="tab-specs" aria-selected={tab === 'specs'} aria-controls="boss-panel" onClick={() => setTab('specs')}>
          Спеки
        </button>
        <button type="button" role="tab" id="tab-players" aria-selected={tab === 'players'} aria-controls="boss-panel" onClick={() => setTab('players')}>
          Лучшие игроки
        </button>
      </div>

      <div id="boss-panel" role="tabpanel" aria-labelledby={tab === 'specs' ? 'tab-specs' : 'tab-players'}>
        {panel}
      </div>

      <nav className="pager" aria-label="Другие боссы">
        {prev ? (
          <Link to={link(`/raid/${zone.id}/boss/${prev.id}`, { role, stat })}>← {prev.name}</Link>
        ) : (
          <span />
        )}
        {next && <Link to={link(`/raid/${zone.id}/boss/${next.id}`, { role, stat })}>{next.name} →</Link>}
      </nav>
    </>
  );
}
