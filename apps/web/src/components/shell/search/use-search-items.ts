'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useSearchQuery } from '@/lib/api/search-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { loadRecent, rememberRecent, type RecentSearch } from '@/lib/search';
import { buildGroups, type SearchItem, type SearchWho } from '@/lib/search-groups';

const MIN_LENGTH = 2;

/** Pages, quick actions, what was opened lately and the records the API found, grouped, for what has been typed. */
export function useSearchItems(query: string, who: SearchWho) {
  const t = useTranslations('search');
  const tNav = useTranslations('nav.items');
  const term = useDebouncedValue(query.trim(), 250);
  const active = term.length >= MIN_LENGTH;
  const { data, isFetching } = useSearchQuery(term, { skip: !active });
  const [recent, setRecent] = useState<RecentSearch[]>(() =>
    typeof window === 'undefined' ? [] : loadRecent(window.localStorage),
  );
  const hits = active ? data?.hits : undefined;

  const groups = useMemo(
    () =>
      buildGroups({
        needle: query.trim().toLowerCase(),
        who: { isAdmin: who.isAdmin, canEdit: who.canEdit },
        words: { t: (key) => t(key as never), tNav: (key) => tNav(key as never) },
        hits: hits ?? [],
        recent,
      }),
    [query, who.isAdmin, who.canEdit, hits, recent, t, tNav],
  );

  const remember = (item: SearchItem) => {
    const { key, href, title, detail } = item;
    setRecent(rememberRecent(window.localStorage, { key, href, title, detail }));
  };

  return { groups, searching: active && isFetching, active, remember };
}
