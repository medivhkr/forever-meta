import { Link } from 'react-router';
import { useHoverTrigger } from './Hover.tsx';

interface Props {
  id: string;
  name: string;
}

// Имя персонажа; при наведении — карточка с экипировкой
export default function CharacterName({ id, name }: Props) {
  const hover = useHoverTrigger({ kind: 'character', id });
  return (
    <Link to={`/character/${id}`} className="char-name" viewTransition {...hover}>
      {name}
    </Link>
  );
}
