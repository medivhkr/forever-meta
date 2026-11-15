import { useCharacters, useItems } from '../data/api.ts';
import { GEAR_LEFT, GEAR_RIGHT, GEAR_WEAPONS, RACE_LABEL, ROLE_STATS, STAT_LABEL, characterFocus, sumStats } from '../data/items.ts';
import { specInfo } from '../data/specs.ts';
import type { GearSlot } from '../data/types.ts';
import { formatIlvl, formatNumber } from '../lib/format.ts';
import ItemIcon from './ItemIcon.tsx';
import SpecIcon from './SpecIcon.tsx';

// Карточка персонажа при наведении: кто это и что на нём надето
export default function CharacterCard({ id }: { id: string }) {
  const characters = useCharacters();
  const items = useItems();
  const c = characters.data?.byId.get(id);

  if (!c) {
    return (
      <div className="ccard">
        <p className="muted">{characters.isPending ? 'Загрузка…' : 'Нет данных о персонаже'}</p>
      </div>
    );
  }

  const info = specInfo(c.cls, c.spec);
  const byId = items.data?.byId;
  const gearOf = (slots: GearSlot[]) =>
    slots.map((slot) => {
      const itemId = c.gear[slot];
      return { slot, item: itemId !== null && byId ? byId.get(itemId) : undefined };
    });
  const columns = [gearOf([...GEAR_LEFT, 'mainhand']), gearOf([...GEAR_RIGHT, 'offhand', 'ranged'])];
  const totals = sumStats(gearOf([...GEAR_LEFT, ...GEAR_RIGHT, ...GEAR_WEAPONS]).map((g) => g.item));
  const shown = ROLE_STATS[characterFocus(c)].slice(0, 4);

  return (
    <div className="ccard">
      <div className="ccard__head">
        <SpecIcon cls={c.cls} spec={c.spec} size={44} eager />
        <div className="ccard__who">
          <p className="ccard__name">{c.name}</p>
          <p className="ccard__sub">
            {info.name}, {info.clsName.toLowerCase()}. {RACE_LABEL[c.race] ?? c.race}
          </p>
          <p className="ccard__sub">
            &lt;{c.guild}&gt;, {c.realm}
          </p>
        </div>
        <div className="ccard__ilvl">
          <strong>{formatIlvl(c.ilvl)}</strong>
          <span>уровень предметов</span>
        </div>
      </div>

      <div className="ccard__gear">
        {columns.map((column, i) => (
          <ul key={i}>
            {column.map(({ slot, item }) => (
              <li key={slot} data-q={item?.q}>
                {item ? <ItemIcon item={item} size={20} eager /> : <span className="ccard__empty" />}
                <span className="ccard__item">{item ? item.name : 'Пусто'}</span>
                {item && <span className="ccard__lvl">{item.ilvl}</span>}
              </li>
            ))}
          </ul>
        ))}
      </div>

      <dl className="ccard__stats">
        {shown.map((key) => (
          <div key={key}>
            <dt>{STAT_LABEL[key] ?? 'Броня'}</dt>
            <dd>{formatNumber(totals[key] ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
