import { useQuery } from '@tanstack/react-query';
import type { Meta, ZoneData } from './types.ts';

// Данные лежат статичными JSON-файлами рядом с сайтом: их раз в несколько часов
// пересобирает GitHub Actions. TanStack Query берёт на себя загрузку, кеш и повтор при ошибке.

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(import.meta.env.BASE_URL + path);
  if (!res.ok) throw new Error(`Не удалось загрузить ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => getJson<Meta>(`data/meta.json?t=${Math.floor(Date.now() / 600_000)}`),
  });
}

// version — время сборки данных: новая сборка даёт новый ключ кеша и новый URL файла.
export function useZone(zoneId: number | undefined, version: string | undefined) {
  return useQuery({
    queryKey: ['zone', zoneId, version],
    queryFn: () => getJson<ZoneData>(`data/zone-${zoneId}.json?v=${encodeURIComponent(version ?? '')}`),
    enabled: zoneId !== undefined && version !== undefined,
  });
}
