import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { Tabs } from '@/components/ui/tabs';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  variant?: 'buttons' | 'tabs';
}

type Thumb = { x: number; w: number };

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

export default function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="switch-row">
      <Tabs
        label={label}
        size="lg"
        value={value}
        options={options.map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
        onValueChange={(v) => onChange(v as T)}
      />
    </div>
  );
}
