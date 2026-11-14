import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useMeta } from '../data/api.ts';
import { formatDateTime } from '../lib/format.ts';
import BrandMark from './BrandMark.tsx';
import SearchBox from './SearchBox.tsx';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : undefined);

export default function Layout() {
  const { data: meta } = useMeta();
  const { pathname } = useLocation();
  // «Тир-лист» подсвечен и на страницах рейдов, боссов и спеков
  const tierActive = pathname === '/' || pathname.startsWith('/raid') || pathname.startsWith('/spec');
  const charsActive = pathname.startsWith('/character');
  const itemsActive = pathname.startsWith('/item');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" aria-label="Forever Meta, на главную">
            <BrandMark className="brand__mark" />
            <span className="brand__name">Forever Meta</span>
          </Link>
          <nav className="nav" aria-label="Разделы">
            <Link to="/" className={tierActive ? 'is-active' : undefined} aria-current={tierActive ? 'page' : undefined}>
              Тир-лист
            </Link>
            <Link to="/characters" className={charsActive ? 'is-active' : undefined} aria-current={charsActive ? 'page' : undefined}>
              Персонажи
            </Link>
            <Link to="/items" className={itemsActive ? 'is-active' : undefined} aria-current={itemsActive ? 'page' : undefined}>
              Предметы
            </Link>
            <NavLink to="/forever" className={navClass}>
              Forever
            </NavLink>
            <NavLink to="/about" className={navClass}>
              О данных
            </NavLink>
          </nav>
          <SearchBox />
        </div>
      </header>

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
    </div>
  );
}
