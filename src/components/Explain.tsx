import type { ReactNode } from 'react';

// Раскрывающееся пояснение на нативном <details>: работает без JavaScript и с клавиатуры
export default function Explain({ title = 'Как считаем', children }: { title?: string; children: ReactNode }) {
  return (
    <details className="explain">
      <summary>{title}</summary>
      <div className="explain__body">{children}</div>
    </details>
  );
}
