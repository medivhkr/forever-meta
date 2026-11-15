import { Link } from 'react-router';
import type { ZoneData } from '../data/types.ts';
import { TIERS, type SpecScore } from '../data/tiers.ts';
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

const tierColor = (id: string) => TIERS.find((t) => t.id === id)?.color ?? 'var(--tier-x)';

// Рейтинг спеков: тир, полоса цвета класса и доля от лучшего спека на каждом боссе
export default function Heatmap({ zone, scores, bossHref, specHref }: Props) {
  return (
    <div className="table-wrap">
      <table className="table rank-table">
        <thead>
          <tr>
            <th scope="col" className="r">
              #
            </th>
            <th scope="col">Тир</th>
            <th scope="col">Спек</th>
            <th scope="col" className="r">
              В среднем
            </th>
            {zone.encounters.map((enc) => (
              <th key={enc.id} scope="col" className="r rank-table__boss">
                <Link to={bossHref(enc.id)} title={enc.name} viewTransition>
                  {enc.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => {
            const info = specInfo(s.cls, s.spec, s.metric);
            const tier = s.sparse ? 'X' : s.tier;
            return (
              <tr key={info.key}>
                <td className="r rank-table__pos">{i + 1}</td>
                <td className="cell-tier" style={cssVars({ '--tc': s.sparse ? 'var(--tier-x)' : tierColor(tier) })}>
                  {tier}
                </td>
                <td className="rank-table__spec">
                  <Link
                    to={specHref(s)}
                    className="specbar"
                    style={cssVars({ '--c': info.color, '--w': `${(s.score * 100).toFixed(1)}%` })}
                    viewTransition
                  >
                    <span className="specbar__fill" aria-hidden="true" />
                    <SpecIcon cls={s.cls} spec={s.spec} size={22} />
                    <span className="specbar__name">
                      {info.name} {info.clsName.toLowerCase()}
                    </span>
                  </Link>
                </td>
                <td className="r cell-heat" style={cssVars({ '--p': heat(s.score) })}>
                  {formatPercent(s.score)}
                </td>
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
                      {Math.round(cell.rel * 100)}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
