const numberFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const percentFmt = new Intl.NumberFormat('ru-RU', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatNumber = (n: number) => numberFmt.format(n);
export const formatPercent = (x: number) => percentFmt.format(x);
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatDate = (ms: number | null) => (ms ? dateFmt.format(new Date(ms)) : '—');

export function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// 1 босс, 2 босса, 5 боссов
export function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}
