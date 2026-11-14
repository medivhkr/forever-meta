import { Link } from 'react-router';
import type { ZoneRef } from '../data/types.ts';
import { zoneTitle } from '../data/specs.ts';
import { plural } from '../lib/format.ts';

interface Props {
  zones: ZoneRef[];
  activeId: number;
  hrefFor: (zoneId: number) => string;
}

export default function ZoneTabs({ zones, activeId, hrefFor }: Props) {
  return (
    <nav className="zones" aria-label="Рейды">
      {zones.map((zone) => {
        const title = zoneTitle(zone.name);
        const active = zone.id === activeId;
        const count = zone.encounters.length;
        return (
          <Link
            key={zone.id}
            to={hrefFor(zone.id)}
            className={active ? 'zone is-active' : 'zone'}
            aria-current={active ? 'page' : undefined}
            title={title.en}
          >
            <span className="zone__name">{title.ru}</span>
            <span className="zone__meta">
              {count} {plural(count, 'босс', 'босса', 'боссов')}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
