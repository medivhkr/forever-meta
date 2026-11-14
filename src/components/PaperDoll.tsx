import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { GEAR_LABEL, GEAR_LEFT, GEAR_RIGHT, GEAR_WEAPONS } from '../data/items.ts';
import type { Character, GearSlot, Item } from '../data/types.ts';
import ItemIcon from './ItemIcon.tsx';
import { useHoverTrigger } from './Hover.tsx';

interface Props {
  character: Character;
  items: Map<number, Item>;
  children?: ReactNode;
}

// «Кукла» персонажа как в оружейной: слоты слева и справа, оружие снизу, в центре — сводка
export default function PaperDoll({ character, items, children }: Props) {
  const itemIn = (slot: GearSlot) => {
    const id = character.gear[slot];
    return id !== null ? items.get(id) : undefined;
  };
  const twoHanded = itemIn('mainhand')?.slot === 'twohand';

  return (
    <div className="doll">
      <div className="doll__col">
        {GEAR_LEFT.map((slot) => (
          <GearSlotView key={slot} slot={slot} item={itemIn(slot)} side="left" />
        ))}
      </div>
      <div className="doll__center">{children}</div>
      <div className="doll__col doll__col--right">
        {GEAR_RIGHT.map((slot) => (
          <GearSlotView key={slot} slot={slot} item={itemIn(slot)} side="right" />
        ))}
      </div>
      <div className="doll__weapons">
        {GEAR_WEAPONS.map((slot) => (
          <GearSlotView
            key={slot}
            slot={slot}
            item={itemIn(slot)}
            side="left"
            emptyNote={slot === 'offhand' && twoHanded ? 'Занята двуручным оружием' : undefined}
          />
        ))}
      </div>
    </div>
  );
}

interface SlotProps {
  slot: GearSlot;
  item: Item | undefined;
  side: 'left' | 'right';
  emptyNote?: string;
}

function GearSlotView({ slot, item, side, emptyNote }: SlotProps) {
  const hover = useHoverTrigger(item ? { kind: 'item', id: item.id } : null);
  const sideClass = side === 'right' ? 'gear gear--right' : 'gear';

  if (!item) {
    return (
      <div className={`${sideClass} is-empty`}>
        <span className="gear__blank" aria-hidden="true" />
        <span className="gear__text">
          <span className="gear__name">{emptyNote ?? 'Пусто'}</span>
          <span className="gear__meta">{GEAR_LABEL[slot]}</span>
        </span>
      </div>
    );
  }

  return (
    <Link to={`/item/${item.id}`} className={sideClass} data-q={item.q} {...hover}>
      <ItemIcon item={item} size={42} />
      <span className="gear__text">
        <span className="gear__name">{item.name}</span>
        <span className="gear__meta">
          {GEAR_LABEL[slot]} · {item.ilvl}
        </span>
      </span>
    </Link>
  );
}
