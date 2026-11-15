import { Link } from 'react-router';
import { TIERS, type SpecScore } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatPercent } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import SpecIcon from './SpecIcon.tsx';
import TierEmblem from './TierEmblem.tsx';

interface Props {
  scores: SpecScore[];
  specHref: (score: SpecScore) => string;
}

// Спеки, которых мало на боссах рейда, уходят в отдельный ряд X: их оценке нельзя доверять
const ROWS = [...TIERS, { id: 'X', min: 0, label: 'мало данных', color: 'var(--tier-x)' }];

export default function TierBoard({ scores, specHref }: Props) {
  return (
    <>
      <table className="tierlist">
        <tbody>
          {ROWS.map((tier) => {
            const items = scores.filter((s) => (tier.id === 'X' ? s.sparse : !s.sparse && s.tier === tier.id));
            if (tier.id === 'X' && items.length === 0) return null;
            return (
              <tr key={tier.id} style={cssVars({ '--tc': tier.color })}>
                <th scope="row" className="tierlist__tier" title={`Тир ${tier.id}: ${tier.label}`}>
                  <TierEmblem tier={tier.id} color={tier.color} label={`Тир ${tier.id}, ${tier.label}`} />
                </th>
                <td className="tierlist__specs">
                  {items.length > 0 ? (
                    <ul>
                      {items.map((s) => {
                        const info = specInfo(s.cls, s.spec, s.metric);
                        return (
                          <li key={info.key}>
                            <Link
                              to={specHref(s)}
                              viewTransition
                              className="tspec"
                              title={`В среднем ${formatPercent(s.score)} от лучшего спека на каждом боссе`}
                            >
                              <SpecIcon cls={s.cls} spec={s.spec} size={40} vt={`spec-${s.cls}-${s.spec}`} />
                              <span className="tspec__text">
                                <span className="tspec__name">
                                  {info.name} <span className="tspec__cls">{info.clsName}</span>
                                </span>
                                <span className="tspec__score">{formatPercent(s.score)}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="tierlist__empty">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="tier-legend">
        {ROWS.map((t, i) => (
          <span key={t.id} style={cssVars({ '--tc': t.color })}>
            <b>{t.id}</b> = {t.label}
            {i < ROWS.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
    </>
  );
}
