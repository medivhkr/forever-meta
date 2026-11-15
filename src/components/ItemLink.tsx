import { Link } from 'react-router';
import type { Item } from '../data/types.ts';
import ItemIcon from './ItemIcon.tsx';
import { useHoverTrigger } from './Hover.tsx';

interface Props {
  item: Item;
  size?: number;
  icon?: boolean;
  vt?: boolean;
}

// Ссылка на предмет: название в цвете качества, при наведении — подсказка с характеристиками
export default function ItemLink({ item, size = 24, icon = true, vt = false }: Props) {
  const hover = useHoverTrigger({ kind: 'item', id: item.id });
  return (
    <Link to={`/item/${item.id}`} className="item-link" data-q={item.q} viewTransition {...hover}>
      {icon && <ItemIcon item={item} size={size} vt={vt} />}
      <span className="item-link__name">{item.name}</span>
    </Link>
  );
}
