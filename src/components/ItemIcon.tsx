import type { Item } from '../data/types.ts';
import GameIcon from './GameIcon.tsx';

// Иконка предмета с рамкой цвета качества
export default function ItemIcon({ item, size = 36, eager = false }: { item: Item; size?: number; eager?: boolean }) {
  return <GameIcon icon={item.icon} size={size} quality={item.q} letter={item.name.charAt(0)} className="item-icon" eager={eager} />;
}
