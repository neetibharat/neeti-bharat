import {
  REQUEST_BOARD_LIMIT,
  type RequestBoardCard,
  type RequestListItem,
  type RequestStatus,
  type RequestType,
} from '@dpdp-kit/shared';
import { useState } from 'react';
import { useLazyGetRequestsQuery } from '@/lib/api/requests-api';
import { appendUnique, hasMore, type BoardCardData } from '@/lib/request-board';

export interface ColumnMoreInput {
  status: RequestStatus;
  /** The cards the board came with. */
  cards: RequestBoardCard[];
  /** How many requests have this status, whatever the type and the search. */
  count: number;
  type?: RequestType;
  q?: string;
}

/** One board column: the cards from the board, and the later pages the list endpoint gives for "Show more". */
export function useColumnMore(input: ColumnMoreInput) {
  const { status, type, q } = input;
  const [load, { isFetching }] = useLazyGetRequestsQuery();
  const [more, setMore] = useState<RequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [matched, setMatched] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const cards = appendUnique<BoardCardData>(input.cards, more);

  const showMore = async () => {
    const result = await load({ tab: status, type, q, page: page + 1, limit: REQUEST_BOARD_LIMIT });
    if (!result.data) {
      setError(result.error ?? true);
      return;
    }
    const { items, total } = result.data;
    setError(null);
    setMore((shown) => [...shown, ...items]);
    setPage(page + 1);
    setMatched(total);
  };

  const canLoad = hasMore({
    shown: cards.length,
    count: input.count,
    filtered: type !== undefined || q !== undefined,
    limit: REQUEST_BOARD_LIMIT,
    matched,
  });
  return { cards, canLoad, isLoading: isFetching, error, showMore };
}
