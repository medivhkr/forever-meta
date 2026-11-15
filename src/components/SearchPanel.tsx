import { useDeferredValue, useEffect, useEffectEvent, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCharacters, useItems } from '../data/api.ts';
import { specInfo } from '../data/specs.ts';
import type { Character, Item } from '../data/types.ts';
import ItemIcon from './ItemIcon.tsx';
import SpecIcon from './SpecIcon.tsx';
import { ArrowIcon, CloseIcon, SearchIcon } from './Icons.tsx';

type Result = { kind: 'character'; c: Character } | { kind: 'item'; item: Item };

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

const QUICK = [
  { to: '/planner', label: 'Собрать комплект в конструкторе' },
  { to: '/items', label: 'Все предметы' },
  { to: '/characters', label: 'Все персонажи' },
  { to: '/forever', label: 'Когда откроются рейды Forever' },
];

interface Props {
  open: boolean;
  onOpen: () => void;
  // restoreFocus: вернуть фокус на значок поиска (закрыли панель), а не оставить его новой странице (перешли по ссылке)
  onClose: (restoreFocus: boolean) => void;
}

// Поиск как на apple.com: значок в шапке открывает панель под ней, страница позади размывается.
// Ctrl+K или «/» открывают поиск с клавиатуры.
export default function SearchPanel({ open, onOpen, onClose }: Props) {
  // useEffectEvent: обработчик всегда видит свежий onOpen, а подписка на клавиатуру создаётся один раз
  const openFromKeyboard = useEffectEvent(onOpen);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable);
      // e.code, а не e.key: сочетание работает и в русской раскладке, где K — это «Л»
      const shortcut = e.code === 'KeyK' && (e.ctrlKey || e.metaKey);
      const slash = !typing && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '/' || e.code === 'Slash');
      if (shortcut || slash) {
        e.preventDefault();
        openFromKeyboard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return open ? <Flyout onClose={onClose} /> : null;
}

function Flyout({ onClose }: { onClose: (restoreFocus: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  // useDeferredValue: ввод остаётся отзывчивым, а фильтрация 600 предметов идёт с низким приоритетом
  const deferred = useDeferredValue(query);
  const characters = useCharacters();
  const items = useItems();
  const navigate = useNavigate();
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

  // Esc закрывает панель, даже если фокус ушёл со строки поиска
  const closeFromKeyboard = useEffectEvent(() => onClose(true));
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeFromKeyboard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(result: Result) {
    onClose(false);
    navigate(result.kind === 'character' ? `/character/${result.c.id}` : `/item/${result.item.id}`, { viewTransition: true });
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
    }
  }

  const showResults = query.trim().length >= 2;

  return (
    <>
      <div className="search-scrim" onClick={() => onClose(true)} aria-hidden="true" />
      <div className="search-panel" role="dialog" aria-label="Поиск">
        <div className="search-panel__inner">
          <div className="search-field">
            <SearchIcon className="search-field__icon" />
            <input
              id="global-search"
              type="search"
              placeholder="Персонаж или предмет"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              role="combobox"
              aria-label="Поиск персонажей и предметов"
              aria-expanded={showResults}
              aria-controls={showResults ? listId : undefined}
              aria-activedescendant={showResults && results[active] ? `${listId}-${active}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
            />
            <button type="button" className="search-field__close" onClick={() => onClose(true)} aria-label="Закрыть поиск">
              <CloseIcon />
            </button>
          </div>

          {showResults ? (
            <ul className="search-results" id={listId} role="listbox" aria-label="Результаты поиска">
              {results.length === 0 && (
                <li className="search__empty" role="presentation">
                  Ничего не нашлось
                </li>
              )}
              {results.map((r, i) => {
                const props = {
                  id: `${listId}-${i}`,
                  role: 'option' as const,
                  'aria-selected': i === active,
                  className: i === active ? 'search__opt is-active' : 'search__opt',
                  onClick: () => go(r),
                  onMouseEnter: () => setActive(i),
                };
                if (r.kind === 'character') {
                  const info = specInfo(r.c.cls, r.c.spec);
                  return (
                    <li key={r.c.id} {...props}>
                      <SpecIcon cls={r.c.cls} spec={r.c.spec} size={36} eager />
                      <span className="search__text">
                        <span className="search__name">{r.c.name}</span>
                        <span className="search__sub">
                          {info.name}, {info.clsName.toLowerCase()}, {r.c.realm}
                        </span>
                      </span>
                      <span className="search__tag">Персонаж</span>
                    </li>
                  );
                }
                return (
                  <li key={r.item.id} {...props} data-q={r.item.q}>
                    <ItemIcon item={r.item} size={36} eager />
                    <span className="search__text">
                      <span className="search__name search__name--item">{r.item.name}</span>
                      <span className="search__sub">
                        {r.item.slotRu}
                        {r.item.typeRu ? `, ${r.item.typeRu.toLowerCase()}` : ''}, уровень {r.item.ilvl}
                      </span>
                    </span>
                    <span className="search__tag">Предмет</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <nav className="search-quick" aria-labelledby={`${listId}-quick`}>
              <p className="search-quick__title" id={`${listId}-quick`}>
                Быстрые ссылки
              </p>
              <ul>
                {QUICK.map((q) => (
                  <li key={q.to}>
                    <Link to={q.to} viewTransition onClick={() => onClose(false)}>
                      <ArrowIcon className="search-quick__icon" />
                      {q.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
