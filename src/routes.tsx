import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import Layout from './components/Layout.tsx';
import RouteError from './components/RouteError.tsx';
import { HoverProvider } from './components/Hover.tsx';
import TierPage from './pages/TierPage.tsx';
import NotFound from './pages/NotFound.tsx';
import { pages } from './lib/pages.ts';

// Ленивый маршрут: код страницы скачивается при первом переходе на неё
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

function Root() {
  return (
    <HoverProvider>
      <Layout />
    </HoverProvider>
  );
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      {
        // Граница ошибок: если страница упадёт, шапка и меню останутся на месте
        errorElement: <RouteError />,
        children: [
          { index: true, element: <TierPage /> },
          { path: 'raid/:zoneId', element: <TierPage /> },
          { path: 'raid/:zoneId/boss/:encounterId', lazy: lazyPage(pages.boss) },
          { path: 'spec/:cls/:spec', lazy: lazyPage(pages.spec) },
          { path: 'characters', lazy: lazyPage(pages.characters) },
          { path: 'character/:id', lazy: lazyPage(pages.character) },
          { path: 'items', lazy: lazyPage(pages.items) },
          { path: 'item/:id', lazy: lazyPage(pages.item) },
          { path: 'planner', lazy: lazyPage(pages.planner) },
          { path: 'forever', lazy: lazyPage(pages.forever) },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
