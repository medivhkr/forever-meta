import { useRef } from 'react';
import { Link } from 'react-router';
import type { ZoneRef } from '../data/types.ts';
import { zoneTitle } from '../data/specs.ts';
import { plural } from '../lib/format.ts';
import { ThumbView, useThumb } from './Segmented.tsx';

interface Props {
  zones: ZoneRef[];
  activeId: number;
  hrefFor: (zoneId: number) => string;
  onIntent?: (zoneId: number) => void; // наведение или фокус: можно заранее подгрузить данные рейда
}

// Выбор рейда: большой переключатель в стиле iOS, плашка переезжает к выбранному рейду
export default function ZoneTabs({ zones, activeId, hrefFor, onIntent }: Props) {
  const group = useRef<HTMLDivElement>(null);
  const thumb = useThumb(group, '[aria-current="page"]', activeId);

  return (
    <nav className="zones-wrap" aria-label="Рейды">
      <div ref={group} className={thumb ? 'zones has-thumb' : 'zones'}>
        <ThumbView thumb={thumb} />
        {zones.map((zone) => {
          const title = zoneTitle(zone.name);
          const count = zone.encounters.length;
          return (
            <Link
              key={zone.id}
              to={hrefFor(zone.id)}
              viewTransition
              preventScrollReset
              onMouseEnter={() => onIntent?.(zone.id)}
              onFocus={() => onIntent?.(zone.id)}
              className="zone"
              aria-current={zone.id === activeId ? 'page' : undefined}
              title={title.en}
            >
              <span className="zone__name">{title.ru}</span>
              <span className="zone__meta">
                {count} {plural(count, 'босс', 'босса', 'боссов')}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
