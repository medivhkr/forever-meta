import { specInfo } from '../data/specs.ts';
import GameIcon from './GameIcon.tsx';

interface Props {
  cls: string;
  spec: string;
  size?: number;
}

export default function SpecIcon({ cls, spec, size = 36 }: Props) {
  const info = specInfo(cls, spec);
  return <GameIcon icon={info.icon} size={size} color={info.color} letter={info.name.charAt(0)} className="spec-icon" />;
}
