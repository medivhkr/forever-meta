import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useMeta } from '../data/api.ts';
import { formatDateTime } from '../lib/format.ts';
import { useOnline } from '../lib/useOnline.ts';
import { preload, preloadWhenIdle, type PageName } from '../lib/pages.ts';
import BrandMark from './BrandMark.tsx';
import InstallButton from './InstallButton.tsx';
import SearchPanel from './SearchPanel.tsx';
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

  // Esc закрывает меню на телефоне
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAt(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const intent = (page?: PageName) => (page ? () => preload(page) : undefined);

  return (
    <div className="shell">
      <header className="site-head">
        <div className="navbar">
          <Link to="/" className="brand" aria-label="Forever Meta, на главную" viewTransition>
            <BrandMark className="brand__mark" />
            <span className="brand__name">Forever Meta</span>
          </Link>
          <nav className="navbar__links" aria-label="Разделы">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                viewTransition
                aria-current={item.match(pathname) ? 'page' : undefined}
                // Наведение — сигнал, что сейчас кликнут: начинаем качать код страницы заранее
                onMouseEnter={intent(item.page)}
                onFocus={intent(item.page)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="navbar__tools">
            <InstallButton />
            <button
              ref={searchButton}
              type="button"
              className="searchbtn"
              aria-label="Поиск персонажей и предметов"
              aria-keyshortcuts="Control+K /"
              aria-expanded={searchOpen}
              onClick={() => {
                setMenuAt(null);
                setSearchAt(searchOpen ? null : pathname);
              }}
            >
              <SearchIcon className="searchbtn__icon" />
              <span className="searchbtn__text">Персонаж или предмет</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="burger"
              aria-label={menuOpen ? 'Закрыть меню' : 'Меню'}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => {
                setSearchAt(null);
                setMenuAt(menuOpen ? null : pathname);
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="site-menu" className="menu" aria-label="Разделы">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} viewTransition aria-current={item.match(pathname) ? 'page' : undefined} onClick={() => setMenuAt(null)}>
                {item.label}
              </Link>
            ))}
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

      <main className="page">
        {!online && (
          <p className="notice notice--offline" role="status">
            <strong>Нет сети.</strong> Показываю сохранённые данные: всё, что ты уже открывал, работает без интернета.
          </p>
        )}
        {meta?.partial && (
          <p className="notice" role="status">
            Собраны не все рейды: сборщик упёрся в лимит API Warcraft Logs. Остальное подтянется при следующем обновлении.
          </p>
        )}
        <Outlet />
      </main>

      <footer className="footer">
        <p className="footer__note">
          Forever Meta — фан-проект, не связан с Blizzard Entertainment. World of Warcraft — товарный знак Blizzard Entertainment.
        </p>
        <p className="footer__note">
          {meta ? `${meta.gameVersion}, обновлено ${formatDateTime(meta.generatedAt)}. ` : ''}
          Данные:{' '}
          <a href={meta?.site ?? 'https://www.warcraftlogs.com'} target="_blank" rel="noreferrer">
            Warcraft Logs
          </a>
          ,{' '}
          <a href="https://www.wowhead.com/tbc/ru" target="_blank" rel="noreferrer">
            Wowhead
          </a>
          ,{' '}
          <a href="https://github.com/Hoizame/AtlasLootClassic" target="_blank" rel="noreferrer">
            AtlasLoot
          </a>{' '}
          ·{' '}
          <a href="https://github.com/medivhkr/forever-meta" target="_blank" rel="noreferrer">
            исходный код
          </a>
        </p>
      </footer>

      {/* Новая страница открывается сверху, «назад» возвращает на прежнее место прокрутки */}
      <ScrollRestoration />
    </div>
  );
}
