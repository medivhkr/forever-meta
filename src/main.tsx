import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes } from './routes.tsx';
import './index.css';
import './styles.css';

// Данные меняются раз в несколько часов, поэтому держим их в кеше 5 минут и не перезапрашиваем при фокусе окна.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 2 },
  },
});

// Data router: даёт ленивые маршруты, View Transitions и восстановление прокрутки
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') });

// Новая версия сайта приходит через service worker; после обновления он сам перезагружает открытые
// вкладки (public/sw-extra.js). Но сайт одностраничный: переходы по разделам не идут на сервер, и
// браузер не узнает о новой версии, пока вкладку не перезагрузят. Поэтому проверяем обновление
// каждый раз, когда человек возвращается на вкладку.
if ('serviceWorker' in navigator) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.update())
      .catch(() => {});
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('В index.html нет элемента #root');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
