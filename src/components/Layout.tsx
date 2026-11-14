import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useMeta } from '../data/api.ts';
import { formatDateTime } from '../lib/format.ts';
import BrandMark from './BrandMark.tsx';

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : undefined);

export default function Layout() {
  const { data: meta } = useMeta();
  const { pathname } = useLocation();
  // «Тир-лист» подсвечен и на страницах рейдов, боссов и спеков
  const tierActive = pathname === '/' || pathname.startsWith('/raid') || pathname.startsWith('/spec');

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
            <NavLink to="/forever" className={navClass}>
              WoW Forever
            </NavLink>
            <NavLink to="/about" className={navClass}>
              О данных
            </NavLink>
          </nav>
          {meta && (
            <p className="topbar__meta">
              {meta.gameVersion} · обновлено {formatDateTime(meta.generatedAt)}
            </p>
          )}
        </div>
      </header>

      {meta?.demo && (
        <div className="notice" role="status">
          <div className="container notice__inner">
            <strong>Демо-данные.</strong> Ключ Warcraft Logs ещё не подключён, поэтому цифры на сайте ненастоящие. После первого
            запуска сборщика с ключом здесь появятся реальные логи.
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
          <p>
            Forever Meta — фан-проект, не связан с Blizzard Entertainment. World of Warcraft — товарный знак Blizzard Entertainment.
          </p>
          <p>
            Данные о боях:{' '}
            <a href={meta?.site ?? 'https://www.warcraftlogs.com'} target="_blank" rel="noreferrer">
              Warcraft Logs
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
