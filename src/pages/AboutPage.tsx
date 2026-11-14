import { useMeta } from '../data/api.ts';
import { TIERS, MIN_PARSES } from '../data/tiers.ts';
import { formatDateTime } from '../lib/format.ts';
import { cssVars, usePageTitle } from '../lib/helpers.ts';

export default function AboutPage() {
  usePageTitle('О данных');
  const { data: meta } = useMeta();

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">Методика</p>
        <h1 className="page-title">Откуда цифры и как считается тир</h1>
        <p className="page-sub">Коротко: реальные логи боёв из Warcraft Logs, лучшие парсы каждого спека, сравнение с лучшим спеком на том же боссе.</p>
      </header>

      <div className="prose">
        <h2>Откуда данные</h2>
        <p>
          Все цифры берутся из публичного API <strong>Warcraft Logs</strong> (GraphQL, версия 2)
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
          Персонажи пока демонстрационные: имена, гильдии и результаты придуманы, а экипировка подобрана из настоящих предметов
          по типу брони, оружию класса и нужным характеристикам. Как только появится доступ к API, их заменят реальные игроки из
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
          Сайт статический и лежит на GitHub Pages. Раз в 6 часов GitHub Actions запускает сборщик: он получает токен Warcraft Logs,
          скачивает рейтинги, считает статистику и пересобирает сайт. Ключ API хранится в секретах репозитория и в браузер не
          попадает.
          {meta ? ` Последнее обновление: ${formatDateTime(meta.generatedAt)}.` : ''}
        </p>

        <h2>Стек</h2>
        <p>React 19, TypeScript, Vite, React Router, TanStack Query. Графики и тепловая карта нарисованы без библиотек, на CSS.</p>
      </div>
    </>
  );
}
