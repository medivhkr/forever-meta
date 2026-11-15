import { Link } from 'react-router';
import { plural } from '../lib/format.ts';
import { usePageTitle } from '../lib/helpers.ts';

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
    text: 'Рейды закрыты до 9 декабря, поэтому рейдовых логов пока нет ни у кого.',
  },
  {
    title: 'Рейтинги Warcraft Logs',
    state: 'Частично',
    text: 'Warcraft Logs уже принимает логи подземелий Forever, но рейтингов по подземельям не будет. Рейтинги рейдов появятся после открытия.',
  },
  {
    title: 'API Blizzard',
    state: 'Без урона',
    text: 'Урон и исцеление API Blizzard не отдаёт ни для одной версии игры. Для Forever сейчас доступен только профиль своего аккаунта, поиска чужих персонажей по имени пока нет.',
  },
];

export default function ForeverPage() {
  usePageTitle('WoW Forever');
  const daysLeft = Math.ceil((RAIDS_OPEN.getTime() - Date.now()) / 86_400_000);

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">WoW Forever</h1>
        <p className="page-sub">
          World of Warcraft: Forever вышел 4 ноября 2026 года. Тир-лист Forever появится, как только Warcraft Logs начнёт ранжировать его
          рейды. Интерфейс уже готов: сборщику достаточно указать сайт и рейды.
        </p>
      </header>

      <section className="countdown" aria-label="Открытие рейдов">
        <p className="countdown__date">9 декабря</p>
        <p className="countdown__text">
          {daysLeft > 0
            ? `Открываются первые рейды. Осталось ${daysLeft} ${plural(daysLeft, 'день', 'дня', 'дней')}.`
            : 'Рейды открыты, ждём рейтинги Warcraft Logs.'}
        </p>
      </section>

      <div className="specs">
        <section className="specs__row">
          <h2 className="specs__title">Первые рейды</h2>
          <dl className="specs__body raid-list">
            {RAIDS.map((raid) => (
              <div key={raid.name}>
                <dt lang="en">{raid.name}</dt>
                <dd>{raid.size} игроков</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="specs__row">
          <h2 className="specs__title">Откуда возьмутся данные</h2>
          <div className="specs__body">
            <ul className="columns">
              {STATUS.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p className="columns__state">{item.state}</p>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="lines__more">
              Пока Forever набирает логи, тир-лист работает на TBC Anniversary. <Link to="/">Открыть тир-лист</Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
