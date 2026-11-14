import { useEffect, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router';
import type { Role, StatKey } from '../data/types.ts';
import { ROLES, STATS } from '../data/specs.ts';

// CSS-переменные в style: <div style={cssVars({ '--c': '#3FC7EB' })}>
export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

// Заголовок вкладки браузера. Кастомный хук: внутри обычный useEffect.
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Forever Meta` : 'Forever Meta — тир-лист спеков WoW';
  }, [title]);
}

const DEFAULT_ROLE: Role = 'dps';
const DEFAULT_STAT: StatKey = 'median';

// Роль и метрика хранятся в адресе (?role=heal&stat=top10), поэтому любой вид можно отправить ссылкой.
export function useViewParams() {
  const [params, setParams] = useSearchParams();
  const role = ROLES.find((r) => r === params.get('role')) ?? DEFAULT_ROLE;
  const stat = STATS.find((s) => s === params.get('stat')) ?? DEFAULT_STAT;

  function update(patch: { role?: Role; stat?: StatKey }) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (patch.role) {
          if (patch.role === DEFAULT_ROLE) next.delete('role');
          else next.set('role', patch.role);
        }
        if (patch.stat) {
          if (patch.stat === DEFAULT_STAT) next.delete('stat');
          else next.set('stat', patch.stat);
        }
        return next;
      },
      { replace: true },
    );
  }

  return { role, stat, update };
}

// Собирает ссылку и выкидывает параметры со значением по умолчанию.
export function link(path: string, query: { role?: Role; stat?: StatKey; zone?: number } = {}): string {
  const q = new URLSearchParams();
  if (query.role && query.role !== DEFAULT_ROLE) q.set('role', query.role);
  if (query.stat && query.stat !== DEFAULT_STAT) q.set('stat', query.stat);
  if (query.zone !== undefined) q.set('zone', String(query.zone));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function reportUrl(site: string, code: string, fight: number | null): string {
  return `${site}/reports/${code}${fight ? `#fight=${fight}` : ''}`;
}

export function characterUrl(site: string, region: string, server: string, name: string): string {
  const serverSlug = server.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, '-');
  return `${site}/character/${region.toLowerCase()}/${serverSlug}/${encodeURIComponent(name.toLowerCase())}`;
}
