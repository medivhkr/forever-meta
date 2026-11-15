import { useMeta } from '../data/api.ts';
import { TIERS, MIN_PARSES } from '../data/tiers.ts';
import { formatDateTime } from '../lib/format.ts';
import { cssVars, usePageTitle } from '../lib/helpers.ts';

// Что интересного во фронтенде и где это лежит в коде
const TECH = [
  {
    title: 'Конструктор экипировки',
    text: 'Состояние сборки в useReducer, вся логика — чистые функции. Сборка живёт в адресе страницы и в localStorage: ссылкой можно поделиться.',
    code: 'src/planner/plan.ts',
  },
  {
    title: 'Нативный <dialog>',
    text: 'Окно выбора предмета: браузер сам держит фокус внутри, закрывает по Esc и блокирует страницу под окном.',
    code: 'src/components/ItemPicker.tsx',
  },
  {
    title: 'View Transitions API',
    text: 'Иконка спека или персонажа «перелетает» из списка на его страницу. Data router React Router и view-transition-name в CSS.',
    code: 'src/routes.tsx',
  },
  {
    title: 'PWA и офлайн',
    text: 'Сайт ставится на телефон как приложение. Service worker (Workbox) кеширует код, данные и иконки: открытые страницы работают без сети.',
    code: 'vite.config.ts',
  },
  {
    title: 'Ленивая загрузка и предзагрузка',
    text: 'Каждая страница — отдельный кусок кода. Он начинает качаться при наведении на ссылку, а данные рейда — при наведении на вкладку.',
    code: 'src/lib/pages.ts',
  },
  {
    title: 'Подсказки как в игре',
    text: 'Одна подсказка на всё приложение: контекст, портал в body, useLayoutEffect и ResizeObserver, чтобы не вылезать за экран.',
    code: 'src/components/Hover.tsx',
  },
  {
    title: 'Графики без библиотек',
    text: 'Радар по боссам, тепловая карта и полосы нарисованы на SVG и CSS. Цвета — цвета классов и качества предметов.',
    code: 'src/components/RadarChart.tsx',
  },
  {
    title: 'Современные хуки',
    text: 'useSyncExternalStore для статуса сети, useDeferredValue в поиске, queryOptions и prefetchQuery в TanStack Query.',
    code: 'src/lib/useOnline.ts',
  },
  {
    title: 'Тесты и CI',
    text: 'Vitest и Testing Library: расчёт тиров, база предметов, логика конструктора, компоненты. GitHub Actions гоняет тесты перед каждым деплоем.',
    code: 'src/**/*.test.ts',
  },
];

export default function AboutPage() {
  usePageTitle('О проекте');
  const { data: meta } = useMeta();

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">О проекте</p>
        <h1 className="page-title">Как устроен Forever Meta</h1>
        <p className="page-sub">
          Одностраничное приложение на React 19 и TypeScript без своего бэкенда: данные собираются скриптами в JSON, сайт лежит на
          GitHub Pages и обновляется сам.
        </p>
      </header>

      <section className="block" aria-labelledby="tech">
        <div className="block__head">
          <h2 id="tech">Что внутри</h2>
          <p>Фронтенд-приёмы, которые здесь используются, и где их найти в коде</p>
        </div>
        <ul className="tech">
          {TECH.map((t) => (
            <li key={t.title}>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <code>{t.code}</code>
            </li>
          ))}
        </ul>
      </section>

      <div className="prose">
        <h2>Откуда данные</h2>
        <p>
          Рейтинги берутся из публичного API <strong>Warcraft Logs</strong> (GraphQL, версия 2)
          {meta ? (
            <>
              {' '}
              с сайта <a href={meta.site}>{meta.site.replace('https://', '')}</a>
            </>
          ) : null}
          . Для каждого босса и каждого спека сборщик забирает {meta?.topN ?? 100} лучших парсов.
        </p>
        <p>
          API Blizzard для тир-листа не подходит: он отдаёт профили, экипировку и рейтинги, но не урон и не исцеление в бою. Эти
          цифры есть только в логах, которые игроки сами загружают в Warcraft Logs.
        </p>

        <h2>Предметы и персонажи</h2>
        <p>
          База предметов собрана скриптом <code>scripts/build-items.ts</code>: списки добычи по боссам взяты из открытого аддона{' '}
          <a href="https://github.com/Hoizame/AtlasLootClassic">AtlasLoot Classic</a>, а названия, иконки и характеристики — из базы{' '}
          <a href="https://www.wowhead.com/tbc/ru">Wowhead</a> на русском и английском. В базе только эпические предметы, которые
          можно надеть.
        </p>
        <p>
          Персонажи пока демонстрационные: имена, гильдии и результаты придуманы, а экипировка подобрана из настоящих предметов по
          типу брони, оружию класса и нужным характеристикам. Как только появится доступ к API, их заменят реальные игроки из
          рейтингов.
        </p>

        <h2>Как считается тир</h2>
        <ol>
          <li>
            На каждом боссе берём метрику спека. По умолчанию это медиана 100 лучших парсов: она устойчивее к случайным рекордам,
            чем один лучший результат.
          </li>
          <li>Делим её на значение лучшего спека этой роли на том же боссе. Получается доля от 0 до 100%.</li>
          <li>Усредняем доли по всем боссам рейда. Это оценка спека в рейде.</li>
          <li>Спек с меньше чем {MIN_PARSES} парсами на боссе не учитываем на этом боссе.</li>
        </ol>
        <ul className="tier-legend">
          {TIERS.map((t, i) => {
            const upper = TIERS[i - 1];
            const pct = (x: number) => `${Math.round(x * 100)}%`;
            const range = !upper ? `от ${pct(t.min)}` : t.min === 0 ? `ниже ${pct(upper.min)}` : `от ${pct(t.min)} до ${pct(upper.min)}`;
            return (
              <li key={t.id} style={cssVars({ '--q': t.color })}>
                <span className="tier-badge">{t.id}</span>
                <span>
                  {range} от лучшего спека · цвет качества «{t.label}»
                </span>
              </li>
            );
          })}
        </ul>

        <h2>Что важно помнить</h2>
        <ul>
          <li>Топ-парсы показывают потолок спека в руках сильных игроков, а не средний результат в случайной группе.</li>
          <li>На парсы влияет скорость убийства, состав рейда и баффы. Короткие бои выше ценят спеки с сильным взрывным уроном.</li>
          <li>Метка «мало данных» значит, что спек есть меньше чем на половине боссов рейда.</li>
        </ul>

        <h2>Как обновляется</h2>
        <p>
          Раз в 6 часов GitHub Actions запускает тесты и сборщик: он получает токен Warcraft Logs, скачивает рейтинги, считает
          статистику и пересобирает сайт. Ключ API хранится в секретах репозитория и в браузер не попадает.
          {meta ? ` Последнее обновление: ${formatDateTime(meta.generatedAt)}.` : ''}
        </p>

        <h2>Стек</h2>
        <p>
          React 19, TypeScript, Vite, React Router 7 (data router), TanStack Query 5, vite-plugin-pwa, Vitest и Testing Library. Без
          UI-библиотек: всё оформление — свой CSS.
        </p>
      </div>
    </>
  );
}
