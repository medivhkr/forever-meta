import { useCallback } from 'react';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Character, CharactersDb, Item, ItemsDb, Meta, ZoneData } from './types.ts';
import { bossKey } from './items.ts';

// Данные лежат статичными JSON-файлами рядом с сайтом: рейтинги раз в несколько часов
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
// queryOptions собирает ключ и функцию загрузки в одном месте: их используют и хук, и предзагрузка.
export function zoneQuery(zoneId: number | undefined, version: string | undefined) {
  return queryOptions({
    queryKey: ['zone', zoneId, version],
    queryFn: () => getJson<ZoneData>(`data/zone-${zoneId}.json?v=${encodeURIComponent(version ?? '')}`),
    enabled: zoneId !== undefined && version !== undefined,
  });
}

export function useZone(zoneId: number | undefined, version: string | undefined) {
  return useQuery(zoneQuery(zoneId, version));
}

// Предзагрузка рейда при наведении на вкладку: к клику данные уже в кеше
export function usePrefetchZone(version: string | undefined) {
  const client = useQueryClient();
  return useCallback(
    (zoneId: number) => {
      if (version) void client.prefetchQuery(zoneQuery(zoneId, version));
    },
    [client, version],
  );
}

export interface ItemsIndex {
  db: ItemsDb;
  byId: Map<number, Item>;
  lootByBoss: Map<string, number[]>;
  zoneName: Map<number, string>;
}

// select строит индексы один раз на загруженные данные. Функции объявлены вне хуков:
// TanStack Query запоминает результат, пока не поменялись данные или сама функция.
function selectItems(db: ItemsDb): ItemsIndex {
  const lootByBoss = new Map<string, number[]>();
  for (const zone of db.zones) {
    for (const boss of zone.bosses) lootByBoss.set(bossKey(boss.name), [...(lootByBoss.get(bossKey(boss.name)) ?? []), ...boss.items]);
  }
  return {
    db,
    byId: new Map(db.items.map((item) => [item.id, item])),
    lootByBoss,
    zoneName: new Map(db.zones.map((z) => [z.id, z.name])),
  };
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => getJson<ItemsDb>('data/items.json'),
    staleTime: Infinity,
    select: selectItems,
  });
}

export interface CharactersIndex {
  list: Character[];
  byId: Map<string, Character>;
}

function selectCharacters(db: CharactersDb): CharactersIndex {
  return { list: db.characters, byId: new Map(db.characters.map((c) => [c.id, c])) };
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => getJson<CharactersDb>('data/characters.json'),
    staleTime: Infinity,
    select: selectCharacters,
  });
}
