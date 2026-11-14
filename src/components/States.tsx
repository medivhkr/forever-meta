import type { ReactNode } from 'react';

export function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="skeleton" style={{ height: 72 }} />
      <div className="skeleton" style={{ height: 76 }} />
      <div className="skeleton" style={{ height: 76 }} />
      <div className="skeleton" style={{ height: 76 }} />
      <span className="sr-only">Загружаю данные…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
  return (
    <div className="state" role="alert">
      <h3>Данные не загрузились</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Попробовать ещё раз
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
