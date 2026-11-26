import type { RequestBoardCard } from '@neeti-bharat/shared';
import type { BadgeProps } from '@/components/base/badge/badge';
import { timeLeft, type TimeLeft } from './breach-clock';
import { dueState } from './request-due';

/** What a card shows. A list row has all of it too, so "Show more" can add rows from the list. */
export type BoardCardData = Omit<RequestBoardCard, 'closedAt'>;

type CardTimes = Pick<RequestBoardCard, 'status' | 'dueAt' | 'closedOnTime'>;

/** What the badge on a card says: the words to use and how loud to be. */
export interface CardDue {
  kind: 'closedOnTime' | 'closedLate' | 'left' | 'late';
  color: NonNullable<BadgeProps['color']>;
  /** The time left, or past, for `left` and `late`. */
  time: Pick<TimeLeft, 'unit' | 'days' | 'hours' | 'minutes'> | null;
}

/** Done cards say whether they closed in time; open ones count down, turn amber within a week and red once late. */
export function cardDue(card: CardTimes, now: Date): CardDue {
  const state = dueState(card, now);
  if (state === 'done') {
    const late = card.closedOnTime === false;
    return {
      kind: late ? 'closedLate' : 'closedOnTime',
      color: late ? 'danger' : 'success',
      time: null,
    };
  }
  const { unit, days, hours, minutes } = timeLeft(card.dueAt, now);
  const time = { unit, days, hours, minutes };
  if (state === 'overdue') return { kind: 'late', color: 'danger', time };
  return { kind: 'left', color: state === 'soon' ? 'warning' : 'gray', time };
}

/** The cards already shown with the next page added, leaving out any the board already holds. */
export function appendUnique<T extends { id: string }>(shown: T[], more: T[]): T[] {
  const known = new Set(shown.map((card) => card.id));
  return [...shown, ...more.filter((card) => !known.has(card.id))];
}

/**
 * Whether a column has more to load. The head count ignores the type and the search, so while one is
 * set it cannot say; a full column then offers "Show more" until a page says how many match.
 */
export function hasMore(input: {
  shown: number;
  count: number;
  filtered: boolean;
  limit: number;
  matched: number | null;
}): boolean {
  const total = input.matched ?? (input.filtered ? null : input.count);
  return total === null ? input.shown >= input.limit : input.shown < total;
}

export type RequestViewMode = 'board' | 'list';

/** The view in the address: only list asks for the list, and anything else is the board. */
export const parseViewMode = (value: string | string[] | undefined): RequestViewMode =>
  value === 'list' ? 'list' : 'board';

/** The address of the requests page in a view. The board is the default, so it has no parameter. */
export const requestsHref = (mode: RequestViewMode): string =>
  mode === 'list' ? '/requests?view=list' : '/requests';
