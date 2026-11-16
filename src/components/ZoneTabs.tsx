import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { ZoneRef } from '../data/types.ts';
import { zoneTitle } from '../data/specs.ts';
import { Tabs } from '@/components/ui/tabs';

interface Props {
  zones: ZoneRef[];
  activeId: number;
  hrefFor: (zoneId: number) => string;
  onIntent?: (zoneId: number) => void;
}

export default function ZoneTabs({ zones, activeId, hrefFor, onIntent }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (onIntent) zones.forEach((z) => onIntent(z.id));
  }, [zones, onIntent]);

  return (
    <div className="switch-row switch-row--scroll">
      <Tabs
        label="Рейд"
        size="lg"
        value={String(activeId)}
        options={zones.map((z) => ({ value: String(z.id), label: zoneTitle(z.name).ru }))}
        onValueChange={(id) => navigate(hrefFor(Number(id)), { preventScrollReset: true, viewTransition: true })}
      />
    </div>
  );
}
