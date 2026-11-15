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

// Тир-лист как домашний экран iPhone: каждый спек — «приложение» с иконкой из игры.
// Ряды тиров окрашены цветами качества предметов: S — легендарный, A — эпический и так далее.
export default function TierBoard({ scores, specHref }: Props) {
  return (
    <div className="tiers">
      {TIERS.map((tier) => {
        const items = scores.filter((s) => s.tier === tier.id);
        return (
          <section key={tier.id} className="tier" style={cssVars({ '--q': tier.color })} aria-label={`Тир ${tier.id}, ${tier.label}`}>
            <header className="tier__head">
              <span className="tier__letter" aria-hidden="true">
                {tier.id}
              </span>
              <span className="tier__name">{tier.label}</span>
            </header>
            {items.length > 0 ? (
              <ul className="tier__apps">
                {items.map((s) => {
                  const info = specInfo(s.cls, s.spec, s.metric);
                  return (
                    <li key={info.key}>
                      <Link
                        to={specHref(s)}
                        viewTransition
                        className={s.sparse ? 'app is-sparse' : 'app'}
                        title={
                          s.sparse
                            ? 'Мало данных: спек есть меньше чем на половине боссов'
                            : `В среднем ${formatPercent(s.score)} от лучшего спека на каждом боссе`
                        }
                      >
                        <SpecIcon cls={s.cls} spec={s.spec} size={60} vt={`spec-${s.cls}-${s.spec}`} />
                        <span className="app__name">{info.name}</span>
                        <span className="app__sub">{info.clsName}</span>
                        <span className="app__score">{s.sparse ? 'мало данных' : formatPercent(s.score)}</span>
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
