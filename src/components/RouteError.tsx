import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { EmptyState } from './States.tsx';

// Показывается вместо страницы, если при её отрисовке что-то сломалось
export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Неизвестная ошибка';
  return (
    <EmptyState title="Эта страница сломалась">
      <p>{message}</p>
      <p>
        <Link to="/">Вернуться к тир-листу</Link>
      </p>
    </EmptyState>
  );
}
