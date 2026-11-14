import { useState } from 'react';
import { iconUrls } from '../data/specs.ts';
import { cssVars } from '../lib/helpers.ts';

interface Props {
  icon: string;
  size: number;
  color?: string;
  letter?: string;
  className?: string;
  quality?: number;
}

// Иконка из игровых файлов: сначала CDN Blizzard, потом зеркало Wowhead, потом буква.
export default function GameIcon(props: Props) {
  // key сбрасывает счётчик попыток, когда меняется иконка
  return <IconImage key={props.icon} {...props} />;
}

function IconImage({ icon, size, color = '#8a8a8a', letter = '?', className = '', quality }: Props) {
  const urls = iconUrls(icon);
  const [attempt, setAttempt] = useState(0);

  if (attempt >= urls.length) {
    return (
      <span
        className={`icon-fallback ${className}`}
        data-q={quality}
        style={cssVars({ '--c': color, width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.45)}px` })}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      className={className}
      data-q={quality}
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
