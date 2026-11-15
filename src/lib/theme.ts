// Оформление: светлое, тёмное или как в системе.
// Выбор лежит в localStorage, а до первой отрисовки его применяет маленький скрипт в index.html,
// поэтому страница не мигает светлой темой перед тёмной.

export type ThemeChoice = 'light' | 'dark' | 'system';

const KEY = 'forever-meta:theme';

export function readTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'dark' || saved === 'system' ? saved : 'light';
  } catch {
    return 'light';
  }
}

function isDark(choice: ThemeChoice): boolean {
  return choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function applyTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // без сохранения: тема продержится до перезагрузки
  }
  const set = () => {
    document.documentElement.dataset.theme = choice;
    // Цвет строки состояния на телефоне и панели установленного приложения
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark(choice) ? '#000000' : '#ffffff');
  };
  // View Transitions: старая и новая тема плавно перетекают друг в друга
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('startViewTransition' in document && !calm) document.startViewTransition(set);
  else set();
}
