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

// Цвет клетки: от красного (60% от лучшего и ниже) через жёлтый к зелёному (100%).
// Число всегда написано в клетке, так что цвет только помогает глазу, а не заменяет значение.
const FLOOR = 0.6;
export function heat(rel: number): number {
  return Math.round(Math.min(1, Math.max(0, (rel - FLOOR) / (1 - FLOOR))) * 100);
}

// Тепловая карта «спек × босс»: какой процент от лучшего спека набирает каждый спек на каждом боссе
export default function Heatmap({ zone, scores, bossHref, specHref }: Props) {
  return (
    <div className="table-wrap">
      <table className="table heat">
        <thead>
          <tr>
            <th scope="col">Спек</th>
            {zone.encounters.map((enc) => (
              <th key={enc.id} scope="col" className="r heat__boss">
                <Link to={bossHref(enc.id)} title={enc.name} viewTransition>
                  {enc.name}
                </Link>
              </th>
            ))}
            <th scope="col" className="r">
              Итог
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => {
            const info = specInfo(s.cls, s.spec, s.metric);
            return (
              <tr key={info.key}>
                <th scope="row" className="heat__spec">
                  <Link to={specHref(s)} className="spec-label" style={cssVars({ '--c': info.color })} viewTransition>
                    <SpecIcon cls={s.cls} spec={s.spec} size={20} />
                    <span className="spec-label__name">{info.name}</span>
                    <span className="spec-label__cls">{info.clsName}</span>
                  </Link>
                </th>
                {zone.encounters.map((enc) => {
                  const cell = s.perBoss[enc.id];
                  if (!cell) {
                    return (
                      <td key={enc.id} className="r cell-none" title={`${enc.name}: нет данных`}>
                        —
                      </td>
                    );
                  }
                  return (
                    <td
                      key={enc.id}
                      className="r cell-heat"
                      style={cssVars({ '--p': heat(cell.rel) })}
                      title={`${enc.name}: ${formatPercent(cell.rel)} от лучшего, ${cell.rank}-е место`}
                    >
                      {Math.round(cell.rel * 100)}
                    </td>
                  );
                })}
                <td className="r strong">{formatPercent(s.score)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
