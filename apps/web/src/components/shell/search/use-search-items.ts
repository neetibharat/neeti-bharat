'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useSearchQuery } from '@/lib/api/search-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import type { Icon } from '@tabler/icons-react';
import { SEARCH_HREFS, SEARCH_ICONS, searchablePages } from '@/lib/search';

export interface SearchItem {
  key: string;
  href: string;
  title: string;
  detail?: string;
  tag: string;
  icon: Icon;
}

const MIN_LENGTH = 2;

/** The pages whose name matches, then the records the API found. */
export function useSearchItems(query: string, isAdmin: boolean) {
  const t = useTranslations('search');
  const tNav = useTranslations('nav.items');
  const term = useDebouncedValue(query.trim(), 250);
  const active = term.length >= MIN_LENGTH;
  const { data, isFetching } = useSearchQuery(term, { skip: !active });

  const items = useMemo<SearchItem[]>(() => {
    const needle = query.trim().toLowerCase();
    const pages = searchablePages(isAdmin)
      .map((page) => ({ ...page, title: tNav(page.id) }))
      .filter((page) => page.title.toLowerCase().includes(needle))
      .map((page) => ({
        key: `page:${page.id}`,
        href: page.href,
        icon: page.icon,
        title: page.title,
        tag: t('page'),
      }));
    const records = (active ? (data?.hits ?? []) : [])
      .filter((hit) => hit.kind !== 'person' || isAdmin)
      .map((hit) => ({
        key: `${hit.kind}:${hit.id}`,
        href: SEARCH_HREFS[hit.kind](hit.id),
        icon: SEARCH_ICONS[hit.kind],
        title: hit.title,
        detail: hit.detail,
        tag: t(`kinds.${hit.kind}`),
      }));
    return [...pages, ...records];
  }, [query, active, data, isAdmin, t, tNav]);

  return { items, searching: active && isFetching, active };
}
