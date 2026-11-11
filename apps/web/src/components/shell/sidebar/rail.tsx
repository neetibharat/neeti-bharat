'use client';

import { useTranslations } from 'next-intl';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
import { Link } from '@/i18n/navigation';
import type { AreaId, NavArea } from '@/lib/navigation';
import { RailButton } from './rail-button';

export interface RailProps {
  areas: NavArea[];
  selectedId: AreaId;
  onSelect: (id: AreaId) => void;
}

/** The narrow column of icons: the logo, one icon per area, and the admin areas at the bottom. */
export function Rail({ areas, selectedId, onSelect }: RailProps) {
  const t = useTranslations('nav');
  const tMeta = useTranslations('meta');

  function buttons(list: NavArea[]) {
    return list.map((area) => (
      <RailButton
        key={area.id}
        label={t(`areas.${area.id}`)}
        icon={area.icon}
        selected={area.id === selectedId}
        onPress={() => onSelect(area.id)}
      />
    ));
  }

  return (
    <div className="flex w-16 shrink-0 flex-col items-center border-r border-line py-4">
      <Link
        href="/"
        aria-label={tMeta('title')}
        className="rounded-control focus-visible:focus-ring"
      >
        <BrandMark />
      </Link>
      <div className="mt-6 flex flex-col gap-1">{buttons(areas.filter((a) => !a.adminOnly))}</div>
      <div className="mt-auto flex flex-col gap-1">{buttons(areas.filter((a) => a.adminOnly))}</div>
    </div>
  );
}
