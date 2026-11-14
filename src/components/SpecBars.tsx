import { Link } from 'react-router';
import type { EncounterRow } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatNumber, formatPercent } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import SpecIcon from './SpecIcon.tsx';

interface Props {
  rows: EncounterRow[];
  specHref: (cls: string, spec: string) => string;
}

// Горизонтальные полосы: длина — доля от лучшего спека на этом боссе.
export default function SpecBars({ rows, specHref }: Props) {
  return (
    <ol className="bars">
      {rows.map((row) => {
        const info = specInfo(row.stats.cls, row.stats.spec, row.stats.metric);
        return (
          <li key={info.key} className="bar" style={cssVars({ '--c': info.color, '--w': `${(row.rel * 100).toFixed(1)}%` })}>
            <span className="bar__rank">{row.rank}</span>
            <Link to={specHref(row.stats.cls, row.stats.spec)} className="bar__label">
              <SpecIcon cls={row.stats.cls} spec={row.stats.spec} size={26} />
              <span className="bar__name">{info.name}</span>
              <span className="bar__cls">{info.clsName}</span>
            </Link>
            <span className="bar__track" aria-hidden="true">
              <span className="bar__fill" />
            </span>
            <span className="bar__value" title={`${formatPercent(row.rel)} от лучшего`}>
              {formatNumber(row.value)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
