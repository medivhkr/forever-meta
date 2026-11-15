import { cssVars } from '../lib/helpers.ts';

interface Series {
  label: string;
  color: string;
  values: (number | null)[]; // доля от лучшего спека, 0..1
}

interface Props {
  axes: string[];
  series: Series[];
  min?: number; // какое значение в центре: по умолчанию 50%, чтобы разница 90% и 100% была заметна
  title: string;
}

const SIZE = 560;
const C = SIZE / 2;
const R = 150;
const RINGS = [0.25, 0.5, 0.75, 1];

const short = (name: string) => (name.length > 18 ? `${name.slice(0, 17)}…` : name);

// «Паутинка» по боссам рейда: чем дальше точка от центра, тем ближе спек к лучшему на этом боссе.
// Нарисована на чистом SVG, без библиотек графиков.
export default function RadarChart({ axes, series, min = 0.5, title }: Props) {
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const at = (i: number, radius: number) => [C + Math.cos(angle(i)) * radius, C + Math.sin(angle(i)) * radius] as const;
  const scale = (v: number) => Math.max(0, Math.min(1, (v - min) / (1 - min))) * R;

  return (
    <figure className="radar">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title}>
        {RINGS.map((f) => (
          <polygon
            key={f}
            className="radar__ring"
            points={axes.map((_, i) => at(i, R * f).join(',')).join(' ')}
          />
        ))}
        {axes.map((name, i) => {
          const [x, y] = at(i, R);
          return <line key={name + i} className="radar__axis" x1={C} y1={C} x2={x} y2={y} />;
        })}
        {RINGS.map((f) => (
          <text key={f} className="radar__tick" x={C + 4} y={C - R * f - 4}>
            {Math.round((min + f * (1 - min)) * 100)}%
          </text>
        ))}

        {series.map((s) => {
          const points = s.values.map((v, i) => (v === null ? null : at(i, scale(v))));
          const polygon = points.map((p) => (p ?? [C, C]).join(',')).join(' ');
          return (
            <g key={s.label} style={cssVars({ '--c': s.color })}>
              <polygon className="radar__area" points={polygon} />
              {points.map((p, i) =>
                p ? (
                  <circle key={i} className="radar__dot" cx={p[0]} cy={p[1]} r={4}>
                    <title>{`${s.label} — ${axes[i]}: ${Math.round((s.values[i] ?? 0) * 100)}%`}</title>
                  </circle>
                ) : null,
              )}
            </g>
          );
        })}

        {axes.map((name, i) => {
          const [x, y] = at(i, R + 20);
          const cos = Math.cos(angle(i));
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          return (
            <text key={name + i} className="radar__label" x={x} y={y} textAnchor={anchor} dominantBaseline="middle">
              <title>{name}</title>
              {short(name)}
            </text>
          );
        })}
      </svg>
      <figcaption className="radar__legend">
        {series.map((s) => (
          <span key={s.label} style={cssVars({ '--c': s.color })}>
            <i aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
