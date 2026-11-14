import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCharacters, useItems } from '../data/api.ts';
import { specInfo } from '../data/specs.ts';
import type { Character, Item } from '../data/types.ts';
import { cssVars } from '../lib/helpers.ts';
import ItemIcon from './ItemIcon.tsx';
import SpecIcon from './SpecIcon.tsx';

type Result = { kind: 'character'; c: Character } | { kind: 'item'; item: Item };

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

// Поиск по персонажам и предметам. Ctrl+K или «/» — перейти в поиск.
export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // useDeferredValue: ввод остаётся отзывчивым, а фильтрация 600 предметов идёт с низким приоритетом
  const deferred = useDeferredValue(query);
  const characters = useCharacters();
  const items = useItems();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo<Result[]>(() => {
    const q = norm(deferred.trim());
    if (q.length < 2) return [];
    const chars: Result[] = (characters.data?.list ?? [])
      .filter((c) => norm(c.name).includes(q) || norm(c.guild).includes(q))
      .slice(0, 5)
      .map((c) => ({ kind: 'character', c }));
    const found: Result[] = (items.data?.db.items ?? [])
      .filter((item) => norm(item.name).includes(q) || norm(item.nameEn).includes(q))
      .slice(0, 7)
      .map((item) => ({ kind: 'item', item }));
    return [...chars, ...found];
  }, [deferred, characters.data, items.data]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(result: Result) {
    navigate(result.kind === 'character' ? `/character/${result.c.id}` : `/item/${result.item.id}`);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div className="search">
      <svg className="search__icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        className="search__input"
        placeholder="Персонаж или предмет"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Поиск персонажей и предметов"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <kbd className="search__kbd" aria-hidden="true">
        Ctrl K
      </kbd>
      {showList && (
        <ul className="search__list" id={listId} role="listbox">
          {results.length === 0 && <li className="search__empty">Ничего не нашлось</li>}
          {results.map((r, i) => {
            const isActive = i === active;
            if (r.kind === 'character') {
              const info = specInfo(r.c.cls, r.c.spec);
              return (
                <li
                  key={r.c.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isActive}
                  className={isActive ? 'search__opt is-active' : 'search__opt'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(r);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <SpecIcon cls={r.c.cls} spec={r.c.spec} size={26} />
                  <span className="search__text">
                    <span className="search__name" style={cssVars({ color: info.color })}>
                      {r.c.name}
                    </span>
                    <span className="search__sub">
                      {info.name}, {info.clsName.toLowerCase()} · {r.c.realm}
                    </span>
                  </span>
                  <span className="search__tag">персонаж</span>
                </li>
              );
            }
            return (
              <li
                key={r.item.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isActive}
                className={isActive ? 'search__opt is-active' : 'search__opt'}
                data-q={r.item.q}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(r);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <ItemIcon item={r.item} size={26} />
                <span className="search__text">
                  <span className="search__name search__name--item">{r.item.name}</span>
                  <span className="search__sub">
                    {r.item.slotRu}
                    {r.item.typeRu ? `, ${r.item.typeRu.toLowerCase()}` : ''} · {r.item.ilvl}
                  </span>
                </span>
                <span className="search__tag">предмет</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
