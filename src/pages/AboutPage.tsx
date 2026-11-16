import { useMeta } from '../data/api.ts';
import { PAGE_ICON } from '../data/art.ts';
import { TIERS, MIN_PARSES } from '../data/tiers.ts';
import { formatDateTime } from '../lib/format.ts';
import { usePageTitle } from '../lib/helpers.ts';
import GameIcon from '../components/GameIcon.tsx';
import PageHero from '../components/PageHero.tsx';
import TierEmblem from '../components/TierEmblem.tsx';

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
    text: 'Иконка спека, персонажа или предмета «перелетает» из списка на его страницу. Data router React Router и view-transition-name в CSS.',
    code: 'src/routes.tsx',
  },
  {
    title: 'PWA и офлайн',
    text: 'Сайт ставится на телефон как приложение. Service worker (Workbox) кеширует код, данные и иконки: открытые страницы работают без сети.',
    code: 'vite.config.ts',
  },
  {
    title: 'Ленивая загрузка',
    text: 'Каждая страница — отдельный кусок кода. Он начинает качаться при наведении на ссылку, а данные рейда — при наведении на вкладку.',
    code: 'src/lib/pages.ts',
  },
  {
    title: 'Подсказки как в игре',
    text: 'Одна подсказка на всё приложение: контекст, портал в body, useLayoutEffect и ResizeObserver, чтобы не вылезать за экран.',
    code: 'src/components/Hover.tsx',
  },
  {
    title: 'Таблицы и графики без библиотек',
    text: 'Тир-лист, цветные ячейки рейтинга, полосы классов и радар по боссам — на CSS и SVG.',
    code: 'src/components/Heatmap.tsx',
  },
  {
    title: 'Переключатели с подсветкой',
    text: 'Подсветка выбранной вкладки переезжает к ней: useLayoutEffect меряет кнопку до отрисовки кадра.',
    code: 'src/components/Segmented.tsx',
  },
  {
    title: 'Современные хуки',
    text: 'useEffectEvent для горячих клавиш поиска, useSyncExternalStore для статуса сети, useDeferredValue в поиске.',
    code: 'src/components/SearchPanel.tsx',
  },
  {
    title: 'Тесты и CI',
    text: 'Vitest и Testing Library. GitHub Actions гоняет тесты перед каждым деплоем.',
    code: 'src/**/*.test.ts',
  },
];

export default function AboutPage() {
  usePageTitle('О проекте');
  const { data: meta } = useMeta();

  return (
    <>
      <PageHero
        icon={<GameIcon icon={PAGE_ICON.about} size={64} letter="О" eager />}
        art={PAGE_ICON.about}
        title="Как устроен Forever Meta"
        chips={['React 19', 'TypeScript', 'Vite', 'GitHub Pages']}
        meta={meta ? <>Последнее обновление данных: <b>{formatDateTime(meta.generatedAt)}</b></> : undefined}
      >
        <p>
          Одностраничное приложение без своего бэкенда. Данные собираются скриптами в JSON, сайт лежит на GitHub Pages и обновляется сам
          каждые 6 часов.
        </p>
      </PageHero>

      <div className="stack">
        <section className="panel" aria-labelledby="tech">
          <div className="panel__head">
            <div>
              <h2 id="tech" className="panel__title">
                Что внутри
              </h2>
              <p className="panel__hint">Фронтенд-приёмы, которые здесь используются, и где их найти в коде</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Приём</th>
                  <th scope="col">Что делает</th>
                  <th scope="col">Где в коде</th>
                </tr>
              </thead>
              <tbody>
                {TECH.map((t) => (
                  <tr key={t.title}>
                    <td className="strong">{t.title}</td>
                    <td className="cell-wrap muted">{t.text}</td>
                    <td>
                      <code>{t.code}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Как считается тир</h2>
          </div>
          <div className="panel__body prose">
            <ol>
              <li>
                На каждом боссе берём метрику спека. По умолчанию это медиана 100 лучших парсов: она устойчивее к случайным рекордам, чем один
                лучший результат.
              </li>
              <li>Делим её на значение лучшего спека этой роли на том же боссе. Получается доля от 0 до 100%.</li>
              <li>Усредняем доли по всем боссам рейда. Это оценка спека в рейде.</li>
              <li>Спек с меньше чем {MIN_PARSES} парсами на боссе на этом боссе не учитываем. Если спек есть меньше чем на половине боссов, он помечается «мало данных».</li>
            </ol>
            <ul className="tier-key">
              {TIERS.map((t, i) => {
                const upper = TIERS[i - 1];
                const pct = (x: number) => `${Math.round(x * 100)}%`;
                const range = !upper ? `от ${pct(t.min)}` : t.min === 0 ? `ниже ${pct(upper.min)}` : `от ${pct(t.min)} до ${pct(upper.min)}`;
                return (
                  <li key={t.id}>
                    <TierEmblem tier={t.id} color={t.color} />
                    <span>
                      <b>{t.label[0].toUpperCase() + t.label.slice(1)}</b>: {range} от лучшего спека
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Откуда данные</h2>
          </div>
          <div className="panel__body prose">
            <p>
              Рейтинги — из публичного API <strong>Warcraft Logs</strong> (GraphQL, версия 2)
              {meta ? (
                <>
                  {' '}
                  с сайта <a href={meta.site}>{meta.site.replace('https://', '')}</a>
                </>
              ) : null}
              . Для каждого босса и каждого спека сборщик забирает {meta?.topN ?? 100} лучших парсов. API Blizzard для тир-листа не подходит:
              урона и исцеления в бою в нём нет.
            </p>
            <p>
              База предметов собрана скриптом <code>scripts/build-items.ts</code>: списки добычи из аддона{' '}
              <a href="https://github.com/Hoizame/AtlasLootClassic">AtlasLoot Classic</a>, названия, иконки и характеристики из базы{' '}
              <a href="https://www.wowhead.com/tbc/ru">Wowhead</a>. Экипировка персонажей подобрана из настоящих предметов.
            </p>
            <p>
              Раз в 6 часов GitHub Actions запускает тесты и сборщик и пересобирает сайт. Ключ API хранится в секретах репозитория и в
              браузер не попадает.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Стек</h2>
          </div>
          <div className="panel__body prose">
            <p>
              React 19, TypeScript, Vite, React Router 7 (data router), TanStack Query 5, vite-plugin-pwa, Vitest и Testing Library. Без
              UI-библиотек: всё оформление — свой CSS.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
