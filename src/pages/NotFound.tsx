import { Link } from 'react-router';
import { usePageTitle } from '../lib/helpers.ts';
import { EmptyState } from '../components/States.tsx';

export default function NotFound() {
  usePageTitle('Страница не найдена');
  return (
    <EmptyState title="Такой страницы нет">
      <p>
        Возможно, ссылка устарела. <Link to="/">Открыть тир-лист</Link>
      </p>
    </EmptyState>
  );
}
