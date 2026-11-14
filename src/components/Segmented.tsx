import { useId } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

// Переключатель из нескольких кнопок. Дженерик T, чтобы onChange получал точный тип значения.
export default function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  const id = useId();
  return (
    <div className="seg">
      <span className="seg__label" id={id}>
        {label}
      </span>
      <div className="seg__group" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} title={o.hint} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
