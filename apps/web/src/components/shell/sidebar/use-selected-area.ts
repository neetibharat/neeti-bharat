'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { areaForPath, type AreaId, type NavArea } from '@/lib/navigation';

/**
 * Which area's pages the panel shows. By default, the area of the page you are on.
 * Clicking another rail icon shows that area instead, until you go to a different page.
 */
export function useSelectedArea(areas: NavArea[]) {
  const pathname = usePathname();
  const [picked, setPicked] = useState<{ id: AreaId; path: string } | null>(null);

  const wanted = picked?.path === pathname ? picked.id : areaForPath(pathname).id;
  const selected = areas.find((area) => area.id === wanted) ?? areas[0]!;

  return { pathname, selected, select: (id: AreaId) => setPicked({ id, path: pathname }) };
}
