import { Link } from 'react-router';
import { specInfo } from '../data/specs.ts';
import { cssVars } from '../lib/helpers.ts';
import { useHoverTrigger } from './Hover.tsx';

interface Props {
  id: string;
  name: string;
  cls: string;
  spec: string;
}

// Имя персонажа в цвете класса; при наведении — карточка с экипировкой
export default function CharacterName({ id, name, cls, spec }: Props) {
  const hover = useHoverTrigger({ kind: 'character', id });
  const info = specInfo(cls, spec);
  return (
    <Link to={`/character/${id}`} className="char-name" style={cssVars({ '--c': info.color })} viewTransition {...hover}>
      {name}
    </Link>
  );
}
