import { useState } from 'react';
import { applyTheme, readTheme, type ThemeChoice } from '../lib/theme.ts';
import Segmented from './Segmented.tsx';

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Как в системе' },
];

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);
  return (
    <Segmented
      label="Оформление"
      size="small"
      value={theme}
      options={OPTIONS}
      onChange={(next) => {
        setTheme(next);
        applyTheme(next);
      }}
    />
  );
}
