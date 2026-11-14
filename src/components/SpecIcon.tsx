import { useState } from 'react';
import { iconUrls, specInfo } from '../data/specs.ts';
import { cssVars } from '../lib/helpers.ts';

interface Props {
  cls: string;
  spec: string;
  size?: number;
}

export default function SpecIcon({ cls, spec, size = 36 }: Props) {
  const info = specInfo(cls, spec);
  // key сбрасывает состояние картинки, когда меняется спек
  return <IconImage key={info.icon} icon={info.icon} color={info.color} letter={info.name.charAt(0)} size={size} />;
}

interface IconImageProps {
  icon: string;
  color: string;
  letter: string;
  size: number;
}

function IconImage({ icon, color, letter, size }: IconImageProps) {
  const urls = iconUrls(icon);
  const [attempt, setAttempt] = useState(0);

  // Обе картинки не загрузились: рисуем букву в цвет класса
  if (attempt >= urls.length) {
    return (
      <span
        className="icon-fallback"
        style={cssVars({ '--c': color, width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.45)}px` })}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      className="spec-icon"
      src={urls[attempt]}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setAttempt((a) => a + 1)}
      style={cssVars({ '--c': color })}
    />
  );
}
