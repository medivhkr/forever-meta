import { Link } from 'react-router';
import { TIERS, type SpecScore } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatPercent } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import SpecIcon from './SpecIcon.tsx';

interface Props {
  scores: SpecScore[];
  specHref: (score: SpecScore) => string;
}

export default function TierBoard({ scores, specHref }: Props) {
  return (
    <div className="tiers">
      {TIERS.map((tier) => {
        const items = scores.filter((s) => s.tier === tier.id);
        return (
          <section key={tier.id} className="tier" style={cssVars({ '--q': tier.color })} aria-label={`Тир ${tier.id}`}>
            <div className="tier__head">
              <span className="tier__letter">{tier.id}</span>
              <span className="tier__name">{tier.label}</span>
            </div>
            {items.length > 0 ? (
              <ul className="tier__list">
                {items.map((s) => {
                  const info = specInfo(s.cls, s.spec, s.metric);
                  return (
                    <li key={info.key}>
                      <Link
                        to={specHref(s)}
                        className={s.sparse ? 'chip is-sparse' : 'chip'}
                        style={cssVars({ '--c': info.color })}
                        title={
                          s.sparse
                            ? 'Мало данных: спек есть меньше чем на половине боссов'
                            : `В среднем ${formatPercent(s.score)} от лучшего спека на каждом боссе`
                        }
                      >
                        <SpecIcon cls={s.cls} spec={s.spec} size={36} />
                        <span className="chip__text">
                          <span className="chip__name">{info.name}</span>
                          <span className="chip__sub">{info.clsName}</span>
                        </span>
                        <span className="chip__score">{formatPercent(s.score)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="tier__empty">Никого</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
