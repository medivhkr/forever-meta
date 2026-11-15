import { specInfo } from '../data/specs.ts';
import GameIcon from './GameIcon.tsx';

interface Props {
  cls: string;
  spec: string;
  size?: number;
  eager?: boolean;
  vt?: string;
}

export default function SpecIcon({ cls, spec, size = 36, eager = false, vt }: Props) {
  const info = specInfo(cls, spec);
  return <GameIcon icon={info.icon} size={size} color={info.color} letter={info.name.charAt(0)} className="spec-icon" eager={eager} vt={vt} />;
}
