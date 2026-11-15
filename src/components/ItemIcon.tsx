import type { Item } from '../data/types.ts';
import GameIcon from './GameIcon.tsx';

interface Props {
  item: Item;
  size?: number;
  eager?: boolean;
  vt?: boolean; // включить «перелёт» иконки на страницу предмета
}

// Иконка предмета с рамкой цвета качества
export default function ItemIcon({ item, size = 36, eager = false, vt = false }: Props) {
  return (
    <GameIcon
      icon={item.icon}
      size={size}
      quality={item.q}
      letter={item.name.charAt(0)}
      className="item-icon"
      eager={eager}
      vt={vt ? `item-${item.id}` : undefined}
    />
  );
}
