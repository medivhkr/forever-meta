import { Link } from 'react-router';
import { specInfo } from '../data/specs.ts';
import { cssVars } from '../lib/helpers.ts';
import { useHoverTrigger } from './Hover.tsx';

interface Props {
  id: string;
  name: string;
  cls?: string; // имя окрашивается в цвет класса, как в игре и на Warcraft Logs
}

// Имя персонажа; при наведении — карточка с экипировкой
export default function CharacterName({ id, name, cls }: Props) {
  const hover = useHoverTrigger({ kind: 'character', id });
  return (
    <Link
      to={`/character/${id}`}
      className="char-name"
      style={cls ? cssVars({ '--c': specInfo(cls, '').color }) : undefined}
      viewTransition
      {...hover}
    >
      {name}
    </Link>
  );
}
