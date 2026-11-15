import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useMeta } from '../data/api.ts';
import { formatDateTime } from '../lib/format.ts';
import { cssVars } from '../lib/helpers.ts';
import { useOnline } from '../lib/useOnline.ts';
import { preload, preloadWhenIdle, type PageName } from '../lib/pages.ts';
import BrandMark from './BrandMark.tsx';
import InstallButton from './InstallButton.tsx';
import SearchPanel from './SearchPanel.tsx';
import ThemeSwitch from './ThemeSwitch.tsx';
import { SearchIcon } from './Icons.tsx';

const NAV: { to: string; label: string; page?: PageName; match: (path: string) => boolean }[] = [
  { to: '/', label: 'Тир-лист', match: (p) => p === '/' || p.startsWith('/raid') || p.startsWith('/spec') },
  { to: '/characters', label: 'Персонажи', page: 'characters', match: (p) => p.startsWith('/character') },
  { to: '/items', label: 'Предметы', page: 'items', match: (p) => p.startsWith('/item') },
  { to: '/planner', label: 'Конструктор', page: 'planner', match: (p) => p.startsWith('/planner') },
  { to: '/forever', label: 'Forever', page: 'forever', match: (p) => p.startsWith('/forever') },
  { to: '/about', label: 'О проекте', page: 'about', match: (p) => p.startsWith('/about') },
];

export default function Layout() {
  const { data: meta } = useMeta();
  const { pathname } = useLocation();
  const online = useOnline();
  const searchButton = useRef<HTMLButtonElement>(null);

  // Меню и поиск помнят, на какой странице их открыли. Перешли на другую — они закрыты сами,
  // без эффекта, который сбрасывал бы состояние после смены адреса.
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [searchAt, setSearchAt] = useState<string | null>(null);
  const menuOpen = menuAt === pathname;
  const searchOpen = searchAt === pathname;

  // Когда браузер освободится, заранее скачиваем код остальных страниц
  useEffect(() => {
    preloadWhenIdle();
  }, []);

  // Пока открыто меню на телефоне, страница под ним не прокручивается; Esc закрывает меню
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    root.classList.add('is-locked');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAt(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.classList.remove('is-locked');
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const intent = (page?: PageName) => (page ? () => preload(page) : undefined);

  return (
    <div className="shell">
      <header className={menuOpen ? 'gnav is-open' : 'gnav'}>
        <div className="gnav__bar container">
          <Link to="/" className="brand" aria-label="Forever Meta, на главную" viewTransition>
            <BrandMark className="brand__mark" />
            <span className="brand__name">Forever Meta</span>
          </Link>

          <nav className="gnav__links" aria-label="Разделы">
            {NAV.map((item) => {
              const current = item.match(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  viewTransition
                  aria-current={current ? 'page' : undefined}
                  // Наведение — сигнал, что сейчас кликнут: начинаем качать код страницы заранее
                  onMouseEnter={intent(item.page)}
                  onFocus={intent(item.page)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="gnav__tools">
            <InstallButton />
            <button
              ref={searchButton}
              type="button"
              className="gnav__btn"
              aria-label="Поиск"
              aria-keyshortcuts="Control+K /"
              aria-expanded={searchOpen}
              onClick={() => {
                setMenuAt(null);
                setSearchAt(searchOpen ? null : pathname);
              }}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="gnav__btn gnav__burger"
              aria-label={menuOpen ? 'Закрыть меню' : 'Меню'}
              aria-expanded={menuOpen}
              aria-controls="gnav-menu"
              onClick={() => {
                setSearchAt(null);
                setMenuAt(menuOpen ? null : pathname);
              }}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="gnav-menu" className="gnav__menu" aria-label="Разделы">
            <ul className="container">
              {NAV.map((item, i) => (
                <li key={item.to} style={cssVars({ '--i': i })}>
                  <Link
                    to={item.to}
                    viewTransition
                    aria-current={item.match(pathname) ? 'page' : undefined}
                    onClick={() => setMenuAt(null)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <SearchPanel
        open={searchOpen}
        onOpen={() => {
          setMenuAt(null);
          setSearchAt(pathname);
        }}
        onClose={(restoreFocus) => {
          setSearchAt(null);
          if (restoreFocus) searchButton.current?.focus();
        }}
      />

      {!online && (
        <div className="ribbon ribbon--offline" role="status">
          <p className="container">Нет сети. Показываю сохранённые данные: всё, что ты уже открывал, работает без интернета.</p>
        </div>
      )}
      {meta?.demo && (
        <div className="ribbon" role="status">
          <p className="container">
            Рейтинги и персонажи пока демо: ключ Warcraft Logs ещё не подключён. Предметы настоящие, из Wowhead.{' '}
            <Link to="/about">Как устроен сайт</Link>
          </p>
        </div>
      )}
      {meta?.partial && (
        <div className="ribbon" role="status">
          <p className="container">
            Собраны не все рейды: сборщик упёрся в лимит API Warcraft Logs. Остальное подтянется при следующем обновлении.
          </p>
        </div>
      )}

      <main className="page container">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer__note">
            Forever Meta — фан-проект, не связан с Blizzard Entertainment. World of Warcraft — товарный знак Blizzard Entertainment.
          </p>
          <div className="footer__row">
            <p>
              Данные:{' '}
              <a href={meta?.site ?? 'https://www.warcraftlogs.com'} target="_blank" rel="noreferrer">
                Warcraft Logs
              </a>
              ,{' '}
              <a href="https://www.wowhead.com/tbc/ru" target="_blank" rel="noreferrer">
                Wowhead
              </a>{' '}
              и{' '}
              <a href="https://github.com/Hoizame/AtlasLootClassic" target="_blank" rel="noreferrer">
                AtlasLoot
              </a>
              .{meta ? ` ${meta.gameVersion}, обновлено ${formatDateTime(meta.generatedAt)}.` : ''}{' '}
              <a href="https://github.com/medivhkr/forever-meta" target="_blank" rel="noreferrer">
                Исходный код
              </a>
            </p>
            <ThemeSwitch />
          </div>
        </div>
      </footer>

      {/* Новая страница открывается сверху, «назад» возвращает на прежнее место прокрутки */}
      <ScrollRestoration />
    </div>
  );
}
