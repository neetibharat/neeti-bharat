'use client';

import { useSearchParams } from 'next/navigation';

/** True when the page was opened with `?new=1`, so an "add" dialog can open at once, for example from a quick action in the search. */
export function useOpenFromLink(): boolean {
  return useSearchParams().get('new') === '1';
}
