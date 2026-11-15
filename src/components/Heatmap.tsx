import { Link } from 'react-router';
import type { ZoneData } from '../data/types.ts';
import type { SpecScore } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatPercent } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import SpecIcon from './SpecIcon.tsx';

interface Props {
  zone: ZoneData;
  scores: SpecScore[];
  bossHref: (encounterId: number) => string;
  specHref: (score: SpecScore) => string;
}

// Шкала одного цвета: 60% от лучшего и ниже — самая светлая клетка, 100% — самая насыщенная.
const FLOOR = 0.6;
function heat(rel: number): number {
  return Math.round(Math.min(1, Math.max(0, (rel - FLOOR) / (1 - FLOOR))) * 100);
}

export function HeatLegend() {
  return (
    <div className="heat-legend" aria-hidden="true">
      <span>{Math.round(FLOOR * 100)}% и ниже</span>
      <i />
      <span>100%</span>
    </div>
  );
}

export default function Heatmap({ zone, scores, bossHref, specHref }: Props) {
  return (
    <div className="heat-wrap">
      <table className="heat">
        <thead>
          <tr>
            <th scope="col" className="heat__corner">
              Спек
            </th>
            {zone.encounters.map((enc) => (
              <th key={enc.id} scope="col" className="heat__boss">
                <Link to={bossHref(enc.id)} title={enc.name}>
                  {enc.name}
                </Link>
              </th>
            ))}
            <th scope="col" className="heat__total">
              В среднем
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => {
            const info = specInfo(s.cls, s.spec, s.metric);
            return (
              <tr key={info.key}>
                <th scope="row" className="heat__spec">
                  <Link to={specHref(s)} className="spec-label">
                    <SpecIcon cls={s.cls} spec={s.spec} size={24} />
                    <span className="spec-label__name">{info.name}</span>
                    <span className="spec-label__cls">{info.clsName}</span>
                  </Link>
                </th>
                {zone.encounters.map((enc) => {
                  const cell = s.perBoss[enc.id];
                  if (!cell) {
                    return (
                      <td key={enc.id} className="heat__cell is-none" title={`${enc.name}: нет данных`}>
                        <span className="sr-only">нет данных</span>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={enc.id}
                      className="heat__cell"
                      style={cssVars({ '--p': heat(cell.rel) })}
                      title={`${enc.name}: ${formatPercent(cell.rel)} от лучшего, ${cell.rank}-е место`}
                    >
                      {Math.round(cell.rel * 100)}
                    </td>
                  );
                })}
                <td className="heat__score">{formatPercent(s.score)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
