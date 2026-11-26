'use client';

import { requestRef } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Link } from '@/i18n/navigation';
import { cardDue, type BoardCardData } from '@/lib/request-board';

function DueBadge({ card, now }: { card: BoardCardData; now: Date }) {
  const t = useTranslations('requests.card');
  const { kind, color, time } = cardDue(card, now);

  return <Badge color={color}>{time ? t(kind, time) : t(kind)}</Badge>;
}

/** One request on the board: the person, the number and type, and the time left. The whole card opens the request. */
export function BoardCard({ card, now }: { card: BoardCardData; now: Date }) {
  const t = useTranslations('requests.card');
  const tRequests = useTranslations('requests');
  const tTypes = useTranslations('requests.types');

  return (
    <Link
      href={`/requests/${card.id}`}
      className="block rounded-card outline-none focus-visible:focus-ring"
    >
      <Card padding="sm" className="transition-colors hover:border-line-strong">
        <p className="truncate text-body font-semibold text-fg">{card.personName}</p>
        <p className="mt-0.5 truncate text-label text-fg-muted">
          {t('meta', { ref: requestRef(card.number), type: tTypes(card.type) })}
        </p>
        <p className="mt-0.5 truncate text-caption text-fg-subtle">
          {card.assigneeName ?? tRequests('unassigned')}
        </p>
        <div className="mt-3">
          <DueBadge card={card} now={now} />
        </div>
      </Card>
    </Link>
  );
}
