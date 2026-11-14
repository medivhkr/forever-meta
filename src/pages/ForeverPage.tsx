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
    state: 'ждём',
    text: 'Рейды закрыты до 9 декабря, поэтому рейдовых логов пока нет ни у кого.',
  },
  {
    title: 'Рейтинги Warcraft Logs',
    state: 'частично',
    text: 'Warcraft Logs уже принимает логи подземелий Forever, но рейтингов по подземельям не будет. Рейтинги рейдов появятся после открытия.',
  },
  {
    title: 'API Blizzard',
    state: 'без урона',
    text: 'Урон и исцеление API Blizzard не отдаёт ни для одной версии игры. Для Forever сейчас доступен только профиль своего аккаунта, поиска чужих персонажей по имени пока нет.',
  },
];

export default function ForeverPage() {
  usePageTitle('WoW Forever');
  const daysLeft = Math.ceil((RAIDS_OPEN.getTime() - Date.now()) / 86_400_000);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">WoW Forever</p>
        <h1 className="page-title">Тир-лист Forever появится с открытием рейдов</h1>
        <p className="page-sub">
          World of Warcraft: Forever вышел 4 ноября 2026 года. Первые рейды открываются 9 декабря. Как только Warcraft Logs начнёт их
          ранжировать, сборщику достаточно указать сайт и рейды Forever: интерфейс уже готов.
        </p>
      </header>

      <section className="forever-grid">
        <div className="countdown-card">
          {daysLeft > 0 ? (
            <>
              <span className="countdown-card__num">{daysLeft}</span>
              <span className="countdown-card__label">{plural(daysLeft, 'день', 'дня', 'дней')} до открытия рейдов</span>
            </>
          ) : (
            <span className="countdown-card__label">Рейды открыты, ждём рейтинги Warcraft Logs</span>
          )}
        </div>
        <ul className="raid-cards">
          {RAIDS.map((raid) => (
            <li key={raid.name} className="raid-card">
              <span className="raid-card__name">{raid.name}</span>
              <span className="raid-card__size">{raid.size} игроков</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="block">
        <div className="block__head">
          <h2>Откуда возьмутся данные</h2>
        </div>
        <ul className="status-list">
          {STATUS.map((item) => (
            <li key={item.title} className="status">
              <span className="status__state">{item.state}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="muted small">
          Пока Forever набирает логи, тир-лист работает на TBC Anniversary: <Link to="/">открыть тир-лист</Link>.
        </p>
      </section>
    </>
  );
}
