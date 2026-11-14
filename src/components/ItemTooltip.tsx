import { useItems } from '../data/api.ts';
import type { Item } from '../data/types.ts';
import { zoneTitle } from '../data/specs.ts';
import ItemIcon from './ItemIcon.tsx';

interface Props {
  id?: number;
  item?: Item;
  large?: boolean;
}

// Подсказка предмета в стиле игры: те же строки и цвета, что во всплывающем окне в WoW.
export default function ItemTooltip({ id, item: given, large = false }: Props) {
  const items = useItems();
  const item = given ?? (id !== undefined ? items.data?.byId.get(id) : undefined);

  if (!item) {
    return (
      <div className="wtt">
        <p className="wtt__muted">{items.isPending ? 'Загрузка…' : 'Предмет не найден'}</p>
      </div>
    );
  }

  const zone = items.data?.zoneName.get(item.zone);

  return (
    <div className={large ? 'wtt wtt--large' : 'wtt'} data-q={item.q}>
      <div className="wtt__top">
        <ItemIcon item={item} size={large ? 56 : 40} />
        <div className="wtt__title">
          <p className="wtt__name">{item.name}</p>
          {item.phase && <p className="wtt__phase">{item.phase}-я фаза</p>}
        </div>
      </div>
      <p className="wtt__ilvl">Уровень предмета: {item.ilvl}</p>
      {item.bind && <p>{item.bind}</p>}
      {item.unique && <p>Уникальный</p>}
      <div className="wtt__row">
        <span>{item.slotRu}</span>
        {item.typeRu && <span>{item.typeRu}</span>}
      </div>
      {item.dmg && (
        <div className="wtt__row">
          <span>
            Урон: {item.dmg[0]}–{item.dmg[1]}
          </span>
          {item.speed !== undefined && <span>Скорость {item.speed.toFixed(2)}</span>}
        </div>
      )}
      {item.dps !== undefined && <p>({item.dps.toFixed(1)} ед. урона в секунду)</p>}
      {item.armor !== undefined && <p>Броня: {item.armor}</p>}
      {item.statLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {item.socketsRu?.map((socket, i) => (
        <p key={`${socket}-${i}`} className="wtt__socket" data-socket={item.sockets?.[i]}>
          {socket}
        </p>
      ))}
      {item.socketBonus && <p className="wtt__gray">{item.socketBonus}</p>}
      {item.classes && <p>Классы: {item.classes}</p>}
      <p>Требуется 70-й ур.</p>
      {item.effects?.map((effect) => (
        <p key={effect} className="wtt__green">
          {effect}
        </p>
      ))}
      {item.set && (
        <div className="wtt__set">
          <p className="wtt__gold">
            {item.set.name} (0/{item.set.size})
          </p>
          {item.set.bonuses.map((bonus) => (
            <p key={bonus} className="wtt__gray">
              {bonus}
            </p>
          ))}
        </div>
      )}
      <p className="wtt__source">
        Добыча: {item.boss}
        {zone ? ` · ${zoneTitle(zone).ru}` : ''}
      </p>
    </div>
  );
}
