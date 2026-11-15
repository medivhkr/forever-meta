import { cssVars } from '../lib/helpers.ts';

// Эмблема тира: щит цвета тира с буквой
export default function TierEmblem({ tier, color, label }: { tier: string; color: string; label?: string }) {
  return (
    <svg className="emblem" viewBox="0 0 40 48" role="img" aria-label={label ?? `Тир ${tier}`} style={cssVars({ '--tc': color })}>
      <path className="emblem__shield" d="M3 3h34v22.5C37 35 29.6 41.6 20 45.5 10.4 41.6 3 35 3 25.5Z" />
      <path className="emblem__edge" d="M7 7h26v18.3c0 7.4-5.6 12.6-13 15.9C12.6 37.9 7 32.7 7 25.3Z" />
      <text className="emblem__letter" x="20" y="28" textAnchor="middle" dominantBaseline="middle">
        {tier}
      </text>
    </svg>
  );
}
