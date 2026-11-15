import { Link } from 'react-router';
import { PAGE_ICON } from '../data/art.ts';
import { plural } from '../lib/format.ts';
import { usePageTitle } from '../lib/helpers.ts';
import GameIcon from '../components/GameIcon.tsx';
import PageHero from '../components/PageHero.tsx';

// Дата открытия первых рейдов WoW Forever по анонсу Blizzard. Точное время не объявлено,
// поэтому считаем только дни.
const RAIDS_OPEN = new Date('2026-12-09T00:00:00');

const RAIDS = [
  { name: 'Barrow Deeps', size: 10 },
  { name: 'Hyjal Summit', size: 20 },
  { name: "Onyxia's Lair", size: 40 },
];

const STATUS = [
  {
    title: 'Логи рейдов',
    state: 'Ждём открытия',
    tone: 'wait',
    text: 'Рейды закрыты до 9 декабря, поэтому рейдовых логов пока нет ни у кого.',
  },
  {
    title: 'Рейтинги Warcraft Logs',
    state: 'Частично',
    tone: 'part',
    text: 'Warcraft Logs уже принимает логи подземелий Forever, но рейтингов по подземельям не будет. Рейтинги рейдов появятся после открытия.',
  },
  {
    title: 'API Blizzard',
    state: 'Без урона',
    tone: 'no',
    text: 'Урон и исцеление API Blizzard не отдаёт ни для одной версии игры. Для Forever доступен только профиль своего аккаунта.',
  },
];

export default function ForeverPage() {
  usePageTitle('WoW Forever');
  const daysLeft = Math.ceil((RAIDS_OPEN.getTime() - Date.now()) / 86_400_000);

  return (
    <>
      <PageHero
        icon={<GameIcon icon={PAGE_ICON.forever} size={64} letter="F" eager />}
        art={PAGE_ICON.forever}
        title="Тир-лист WoW Forever"
        chips={['Вышел 4 ноября 2026', 'Рейды с 9 декабря', 'Скоро']}
      >
        <p>
          Тир-лист Forever появится, как только Warcraft Logs начнёт ранжировать его рейды. Интерфейс уже готов: сборщику достаточно указать
          сайт и рейды. Пока что тир-лист работает на <Link to="/">TBC Anniversary</Link>.
        </p>
      </PageHero>

      <div className="stack">
        <section className="panel countdown">
          <div className="countdown__num">{daysLeft > 0 ? daysLeft : 0}</div>
          <div>
            <p className="countdown__label">
              {daysLeft > 0 ? `${plural(daysLeft, 'день', 'дня', 'дней')} до открытия рейдов` : 'Рейды открыты'}
            </p>
            <p className="panel__hint">Первые рейды WoW Forever откроются 9 декабря 2026 года.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Первые рейды</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Рейд</th>
                  <th scope="col" className="r">
                    Игроков
                  </th>
                </tr>
              </thead>
              <tbody>
                {RAIDS.map((raid) => (
                  <tr key={raid.name}>
                    <td className="strong" lang="en">
                      {raid.name}
                    </td>
                    <td className="r">{raid.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Откуда возьмутся данные</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Источник</th>
                  <th scope="col">Статус</th>
                  <th scope="col">Что известно</th>
                </tr>
              </thead>
              <tbody>
                {STATUS.map((item) => (
                  <tr key={item.title}>
                    <td className="strong">{item.title}</td>
                    <td>
                      <span className={`status status--${item.tone}`}>{item.state}</span>
                    </td>
                    <td className="cell-wrap muted">{item.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
