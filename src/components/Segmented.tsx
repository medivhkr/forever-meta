import { useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string; // для скринридера: на экране подписи нет, варианты говорят сами за себя
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: 'regular' | 'small';
}

type Thumb = { x: number; w: number };

// Белая плашка под выбранным вариантом, как в переключателях iOS. Меряем выбранный элемент
// до отрисовки кадра (useLayoutEffect) и двигаем плашку к нему; CSS анимирует перемещение.
export function useThumb(group: RefObject<HTMLElement | null>, selector: string, selected: unknown): Thumb | null {
  const [thumb, setThumb] = useState<Thumb | null>(null);

  useLayoutEffect(() => {
    const el = group.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(selector);
      setThumb((prev) => {
        if (!active) return null;
        const next = { x: active.offsetLeft, w: active.offsetWidth };
        return prev && prev.x === next.x && prev.w === next.w ? prev : next;
      });
    };
    measure();
    // Ширина вариантов меняется, когда догружается шрифт или поворачивают телефон
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [group, selector, selected]);

  return thumb;
}

export function ThumbView({ thumb }: { thumb: Thumb | null }) {
  if (!thumb) return null;
  return <span className="seg__thumb" aria-hidden="true" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }} />;
}

// Переключатель из нескольких кнопок. Дженерик T, чтобы onChange получал точный тип значения.
export default function Segmented<T extends string>({ label, value, options, onChange, size = 'regular' }: Props<T>) {
  const id = useId();
  const group = useRef<HTMLDivElement>(null);
  const thumb = useThumb(group, '[aria-pressed="true"]', value);

  return (
    <div className={size === 'small' ? 'seg seg--small' : 'seg'}>
      <span className="sr-only" id={id}>
        {label}
      </span>
      <div ref={group} className={thumb ? 'seg__group has-thumb' : 'seg__group'} role="group" aria-labelledby={id}>
        <ThumbView thumb={thumb} />
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} title={o.hint} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
