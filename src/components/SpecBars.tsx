import { Link } from 'react-router';
import type { EncounterRow } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatNumber, formatPercent } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import { heat } from './Heatmap.tsx';
import SpecIcon from './SpecIcon.tsx';

interface Props {
  rows: EncounterRow[];
  unit: string;
  specHref: (cls: string, spec: string) => string;
}

// Рейтинг спеков на боссе: полоса цвета класса длиной в долю от лучшего спека, рядом цифры
export default function SpecBars({ rows, unit, specHref }: Props) {
  return (
    <div className="table-wrap">
      <table className="table rank-table">
        <thead>
          <tr>
            <th scope="col" className="r">
              #
            </th>
            <th scope="col">Спек</th>
            <th scope="col" className="r">
              {unit}
            </th>
            <th scope="col" className="r">
              От лучшего
            </th>
            <th scope="col" className="r">
              Парсов
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const info = specInfo(row.stats.cls, row.stats.spec, row.stats.metric);
            return (
              <tr key={info.key}>
                <td className="r rank-table__pos">{row.rank}</td>
                <td className="rank-table__spec rank-table__spec--wide">
                  <Link
                    to={specHref(row.stats.cls, row.stats.spec)}
                    className="specbar"
                    style={cssVars({ '--c': info.color, '--w': `${(row.rel * 100).toFixed(1)}%` })}
                    viewTransition
                  >
                    <span className="specbar__fill" aria-hidden="true" />
                    <SpecIcon cls={row.stats.cls} spec={row.stats.spec} size={22} />
                    <span className="specbar__name">
                      {info.name} {info.clsName.toLowerCase()}
                    </span>
                  </Link>
                </td>
                <td className="r strong">{formatNumber(row.value)}</td>
                <td className="r cell-heat" style={cssVars({ '--p': heat(row.rel) })}>
                  {formatPercent(row.rel)}
                </td>
                <td className="r muted">{formatNumber(row.stats.count)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
