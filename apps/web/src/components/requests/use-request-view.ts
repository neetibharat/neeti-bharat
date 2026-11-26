import {
  REQUEST_BOARD_LIMIT,
  REQUEST_PAGE_SIZE,
  type RequestTab,
  type RequestType,
} from '@neeti-bharat/shared';
import { useState } from 'react';
import { ALL } from '@/lib/filters';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

export type TypeFilter = RequestType | typeof ALL;

/** What the person has chosen: the tab, the type, the search and the page. Changing any but the page goes back to page one. The board and the list share the type and the search. */
export function useRequestView() {
  const [tab, setTab] = useState<RequestTab>('new');
  const [type, setType] = useState<TypeFilter>(ALL);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim());
  const first =
    <T>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  const narrowing = { type: type === ALL ? undefined : type, q: q || undefined };

  return {
    tab,
    type,
    text,
    setPage,
    setTab: first(setTab),
    setType: first(setType),
    setText: first(setText),
    isFiltering: text.trim() !== '' || type !== ALL,
    query: { tab, ...narrowing, page, limit: REQUEST_PAGE_SIZE },
    boardQuery: { ...narrowing, limit: REQUEST_BOARD_LIMIT },
  };
}

export type RequestView = ReturnType<typeof useRequestView>;
