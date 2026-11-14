import type { PlayerRow } from '../data/tiers.ts';
import { specInfo } from '../data/specs.ts';
import { formatDate, formatDuration, formatNumber } from '../lib/format.ts';
import { characterUrl, cssVars, reportUrl } from '../lib/helpers.ts';
import CharacterName from './CharacterName.tsx';
import SpecIcon from './SpecIcon.tsx';

interface Props {
  players: PlayerRow[];
  site: string;
  unit: string;
}

// Место окрашено в цвет качества предмета: 1 — легендарный, 2–3 — эпический, до 10 — редкий.
function rankClass(rank: number): string {
  if (rank === 1) return 'rank rank--legendary';
  if (rank <= 3) return 'rank rank--epic';
  if (rank <= 10) return 'rank rank--rare';
  return 'rank';
}

export default function PlayersTable({ players, site, unit }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col" className="r">
              #
            </th>
            <th scope="col">Игрок</th>
            <th scope="col">Сервер</th>
            <th scope="col" className="r">
              {unit}
            </th>
            <th scope="col" className="r">
              Бой
            </th>
            <th scope="col">Дата</th>
            <th scope="col">
              <span className="sr-only">Лог</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const info = specInfo(p.cls, p.spec, p.metric);
            const wclLink = Boolean(p.report && p.server && p.region);
            return (
              <tr key={`${p.name}-${p.server}-${info.key}-${i}`}>
                <td className={`r ${rankClass(i + 1)}`}>{i + 1}</td>
                <td>
                  <span className="player" style={cssVars({ '--c': info.color })}>
                    <SpecIcon cls={p.cls} spec={p.spec} size={28} />
                    <span className="player__text">
                      {p.charId ? (
                        <CharacterName id={p.charId} name={p.name} cls={p.cls} spec={p.spec} />
                      ) : wclLink ? (
                        <a className="player__name" href={characterUrl(site, p.region, p.server, p.name)} target="_blank" rel="noreferrer">
                          {p.name}
                        </a>
                      ) : (
                        <span className="player__name">{p.name}</span>
                      )}
                      <span className="player__sub">
                        {info.name}, {info.clsName.toLowerCase()}
                        {p.guild ? ` · ${p.guild}` : ''}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="muted">
                  {p.server}
                  {p.region ? ` · ${p.region.toUpperCase()}` : ''}
                </td>
                <td className="r strong">{formatNumber(p.amount)}</td>
                <td className="r muted">{formatDuration(p.duration)}</td>
                <td className="muted">{formatDate(p.date)}</td>
                <td>
                  {p.report ? (
                    <a href={reportUrl(site, p.report, p.fight)} target="_blank" rel="noreferrer" className="ext">
                      лог ↗
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
