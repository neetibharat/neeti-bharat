'use client';

import type { RequestStatus } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useColumnMore, type ColumnMoreInput } from '@/lib/hooks/use-column-more';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { BoardCard } from './board-card';

export interface BoardColumnProps extends ColumnMoreInput {
  now: Date;
  /** The Done column links to the list of everything closed. */
  onSeeAll?: () => void;
}

function Heading({ status, count }: { status: RequestStatus; count: number }) {
  const t = useTranslations('requests.statuses');

  return (
    <header className="flex items-center justify-between px-2 pt-1">
      <h2 className="text-caption font-semibold tracking-wide text-fg-muted uppercase">
        {t(status)}
      </h2>
      <span className="text-label font-semibold text-fg-muted tabular-nums">{count}</span>
    </header>
  );
}

function Footer(props: { more: ReturnType<typeof useColumnMore>; onSeeAll?: () => void }) {
  const t = useTranslations('requests.board');
  const errorMessage = useErrorMessage();
  const { more, onSeeAll } = props;

  return (
    <>
      {more.error !== null && <Alert tone="error">{errorMessage(more.error)}</Alert>}
      {more.canLoad && (
        <Button color="secondary" size="sm" isLoading={more.isLoading} onPress={more.showMore}>
          {t('showMore')}
        </Button>
      )}
      {onSeeAll && (
        <Button color="tertiary" size="sm" onPress={onSeeAll}>
          {t('seeAllClosed')}
        </Button>
      )}
    </>
  );
}

/** One column of the board: a heading with its count, up to ten cards, and a way to see more. */
export function BoardColumn(props: BoardColumnProps) {
  const t = useTranslations('requests.board');
  const more = useColumnMore(props);

  return (
    <section className="flex min-h-48 min-w-0 flex-col gap-3 rounded-card border border-dashed border-line-strong bg-surface-muted p-3">
      <Heading status={props.status} count={props.count} />
      {more.cards.length === 0 ? (
        <p className="px-2 py-6 text-center text-label text-fg-subtle">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {more.cards.map((card) => (
            <li key={card.id}>
              <BoardCard card={card} now={props.now} />
            </li>
          ))}
        </ul>
      )}
      <Footer more={more} onSeeAll={props.onSeeAll} />
    </section>
  );
}
