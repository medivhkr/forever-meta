import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useMeta, useZone, useItems } from '../data/api.ts';
import { ROLE_ICON } from '../data/art.ts';
import { ROLES, ROLE_LABEL, STATS, STAT_LABEL, zoneTitle } from '../data/specs.ts';
import { STAT_SHORT, bossKey, keyStats } from '../data/items.ts';
import { rankEncounter, topPlayers } from '../data/tiers.ts';
import { formatDateTime } from '../lib/format.ts';
import { link, usePageTitle, useViewParams } from '../lib/helpers.ts';
import BackLink from '../components/BackLink.tsx';
import GameIcon from '../components/GameIcon.tsx';
import ItemLink from '../components/ItemLink.tsx';
import PageHero from '../components/PageHero.tsx';
import Segmented, { ThumbView, useThumb } from '../components/Segmented.tsx';
import SpecBars from '../components/SpecBars.tsx';
import PlayersTable from '../components/PlayersTable.tsx';
import { EmptyState, ErrorState, Loading } from '../components/States.tsx';

type Tab = 'specs' | 'players' | 'loot';

const TABS: { id: Tab; label: string }[] = [
  { id: 'specs', label: 'Спеки' },
  { id: 'players', label: 'Лучшие игроки' },
  { id: 'loot', label: 'Добыча' },
];

export default function BossPage() {
  const { zoneId, encounterId } = useParams();
  const { role, stat, update } = useViewParams();
  const [tab, setTab] = useState<Tab>('specs');
  const tabsRef = useRef<HTMLDivElement>(null);
  const thumb = useThumb(tabsRef, '[aria-selected="true"]', tab);
  const meta = useMeta();
  const items = useItems();
  const zone = meta.data?.zones.find((z) => String(z.id) === zoneId);
  const zoneQuery = useZone(zone?.id, meta.data?.generatedAt);
  const encounter = zoneQuery.data?.encounters.find((e) => String(e.id) === encounterId);

  const rows = useMemo(() => (encounter ? rankEncounter(encounter, role, stat) : []), [encounter, role, stat]);
  const players = useMemo(() => (encounter ? topPlayers(encounter, role) : []), [encounter, role]);
  // Добыча босса из базы предметов: сопоставляем по имени босса
  const loot = useMemo(() => {
    if (!encounter || !items.data) return [];
    const { byId, lootByBoss } = items.data;
    const ids = lootByBoss.get(bossKey(encounter.name)) ?? [];
    return ids
      .map((itemId) => byId.get(itemId))
      .filter((item) => item !== undefined)
      .sort((a, b) => b.ilvl - a.ilvl);
  }, [encounter, items.data]);

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
  let head: { title: string; hint: string };
  if (tab === 'specs') {
    head = { title: `Спеки на боссе, ${unit}`, hint: `${STAT_LABEL[stat].long} каждого спека. Полоса — доля от лучшего спека.` };
    panel = rows.length ? <SpecBars rows={rows} specHref={specHref} /> : <EmptyState title="По этой роли данных нет" />;
  } else if (tab === 'players') {
    head = { title: 'Лучшие игроки', hint: `Лучшие ${unit} среди всех спеков роли «${ROLE_LABEL[role].toLowerCase()}». Наведи на имя, чтобы увидеть экипировку.` };
    panel = players.length ? (
      <PlayersTable players={players} site={meta.data.site} unit={unit} />
    ) : (
      <EmptyState title="По этой роли данных нет" />
    );
  } else {
    head = { title: 'Добыча', hint: 'Эпические предметы, которые падают с этого босса. Данные Wowhead и AtlasLoot.' };
    panel = items.isPending ? (
      <Loading />
    ) : loot.length ? (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Предмет</th>
              <th scope="col" className="r">
                Уровень
              </th>
              <th scope="col">Слот</th>
              <th scope="col">Главное</th>
            </tr>
          </thead>
          <tbody>
            {loot.map((item) => (
              <tr key={item.id}>
                <td className="cell-wrap">
                  <ItemLink item={item} size={22} vt />
                </td>
                <td className="r strong">{item.ilvl}</td>
                <td className="muted">
                  {item.slotRu}
                  {item.typeRu ? `, ${item.typeRu.toLowerCase()}` : ''}
                </td>
                <td>
                  <span className="badges">
                    {keyStats(item).map((s) => (
                      <span key={s.key} className="badge">
                        +{s.value} {STAT_SHORT[s.key] ?? s.key}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="Нет данных о добыче">
        <p>Для этого босса в базе предметов пока ничего нет.</p>
      </EmptyState>
    );
  }

  return (
    <>
      <BackLink to={link(`/raid/${zone.id}`, { role, stat })}>Тир-лист: {title.ru}</BackLink>

      <PageHero
        icon={<GameIcon icon={ROLE_ICON[role]} size={64} letter="B" eager />}
        art={ROLE_ICON[role]}
        title={encounter.name}
        chips={[title.ru, `Босс ${index + 1} из ${zone.encounters.length}`, meta.data.gameVersion]}
        meta={
          <>
            Обновлено: <b>{formatDateTime(meta.data.generatedAt)}</b>
          </>
        }
      />

      <div className="tabs-wrap">
        <div ref={tabsRef} className={thumb ? 'tabs has-thumb' : 'tabs'} role="tablist" aria-label="Вид">
          <ThumbView thumb={thumb} />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="boss-panel"
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'loot' && loot.length > 0 && <span className="tabs__count">{loot.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'loot' && (
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
          {tab === 'specs' && (
            <Segmented
              label="Метрика"
              value={stat}
              options={STATS.map((s) => ({ value: s, label: STAT_LABEL[s].short, hint: STAT_LABEL[s].long }))}
              onChange={(s) => update({ stat: s })}
            />
          )}
        </div>
      )}

      <section id="boss-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel">
        <div className="panel__head">
          <div>
            <h2 className="panel__title">{head.title}</h2>
            <p className="panel__hint">{head.hint}</p>
          </div>
        </div>
        {panel}
      </section>

      <nav className="pager" aria-label="Другие боссы">
        {prev ? (
          <Link to={link(`/raid/${zone.id}/boss/${prev.id}`, { role, stat })} viewTransition>
            <span className="pager__dir">Предыдущий босс</span>
            {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={link(`/raid/${zone.id}/boss/${next.id}`, { role, stat })} className="pager__next" viewTransition>
            <span className="pager__dir">Следующий босс</span>
            {next.name}
          </Link>
        )}
      </nav>
    </>
  );
}
