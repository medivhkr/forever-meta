import { useEffect } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useMeta } from '../data/api.ts';
import { formatDateTime } from '../lib/format.ts';
import { useOnline } from '../lib/useOnline.ts';
import { preload, preloadWhenIdle, type PageName } from '../lib/pages.ts';
import BrandMark from './BrandMark.tsx';
import InstallButton from './InstallButton.tsx';
import SearchBox from './SearchBox.tsx';

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

  // Когда браузер освободится, заранее скачиваем код остальных страниц
  useEffect(() => {
    preloadWhenIdle();
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" aria-label="Forever Meta, на главную" viewTransition>
            <BrandMark className="brand__mark" />
            <span className="brand__name">Forever Meta</span>
          </Link>
          <nav className="nav" aria-label="Разделы">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  viewTransition
                  className={active ? 'is-active' : undefined}
                  aria-current={active ? 'page' : undefined}
                  // Наведение — сигнал, что сейчас кликнут: начинаем качать код страницы заранее
                  onMouseEnter={item.page ? () => preload(item.page!) : undefined}
                  onFocus={item.page ? () => preload(item.page!) : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SearchBox />
          <InstallButton />
        </div>
      </header>

      {!online && (
        <div className="notice notice--offline" role="status">
          <div className="container notice__inner">
            <span className="notice__dot" aria-hidden="true" />
            <span>
              <strong>Нет сети.</strong> Показываю сохранённые данные: всё, что ты уже открывал, работает офлайн.
            </span>
          </div>
        </div>
      )}
      {meta?.demo && (
        <div className="notice" role="status">
          <div className="container notice__inner">
            <span className="notice__dot" aria-hidden="true" />
            <span>
              <strong>Демо-режим.</strong> Рейтинги и персонажи — пример, пока не подключён ключ Warcraft Logs. Предметы настоящие:
              из базы Wowhead.
            </span>
          </div>
        </div>
      )}
      {meta?.partial && (
        <div className="notice notice--soft" role="status">
          <div className="container notice__inner">
            Собраны не все рейды: сборщик упёрся в лимит API Warcraft Logs. Остальное подтянется при следующем обновлении.
          </div>
        </div>
      )}

      <main className="page container">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p>Forever Meta — фан-проект, не связан с Blizzard Entertainment. World of Warcraft — товарный знак Blizzard Entertainment.</p>
          <p>
            {meta ? `${meta.gameVersion} · обновлено ${formatDateTime(meta.generatedAt)} · ` : ''}
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
        </div>
      </footer>

      {/* Новая страница открывается сверху, «назад» возвращает на прежнее место прокрутки */}
      <ScrollRestoration />
    </div>
  );
}
