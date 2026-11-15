import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronLeft } from './Icons.tsx';

// Кнопка «назад» как в навигации iOS: шеврон и название предыдущего экрана
export default function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <nav className="back" aria-label="Назад">
      <Link to={to} viewTransition>
        <ChevronLeft className="back__icon" />
        {children}
      </Link>
    </nav>
  );
}
