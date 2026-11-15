// Страницы, которые грузятся отдельными кусками кода (code splitting).
// Те же функции используются для предзагрузки: при наведении на ссылку и когда браузер свободен.

export const pages = {
  boss: () => import('../pages/BossPage.tsx'),
  spec: () => import('../pages/SpecPage.tsx'),
  characters: () => import('../pages/CharactersPage.tsx'),
  character: () => import('../pages/CharacterPage.tsx'),
  items: () => import('../pages/ItemsPage.tsx'),
  item: () => import('../pages/ItemPage.tsx'),
  planner: () => import('../pages/PlannerPage.tsx'),
  forever: () => import('../pages/ForeverPage.tsx'),
  about: () => import('../pages/AboutPage.tsx'),
};

export type PageName = keyof typeof pages;

export function preload(name: PageName) {
  void pages[name]();
}

// Подгружаем все страницы заранее, когда браузеру нечем заняться
export function preloadWhenIdle() {
  const run = () => Object.values(pages).forEach((load) => void load());
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2500);
}
