'use client';

import { IconCheck, IconExternalLink } from '@tabler/icons-react';
import type { MyTrainingItem } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { useCompleteTrainingMutation, useReopenTrainingMutation } from '@/lib/api/training-api';
import { cx } from '@/lib/utils/cx';

/** The day as a date people read, such as "12 November 2026". */
export function useDay() {
  const format = useFormatter();
  return (value: string) =>
    format.dateTime(new Date(`${value}T00:00:00Z`), { dateStyle: 'long', timeZone: 'UTC' });
}

/** The mark at the start of a row: a tick once done, an empty ring until then. */
function Mark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset',
        done ? 'bg-success text-surface ring-success' : 'bg-surface ring-line-strong',
      )}
    >
      {done && <IconCheck className="size-4" />}
    </span>
  );
}

/** A link to the training, which opens in a new tab. */
function OpenLink({ url }: { url: string }) {
  const t = useTranslations('training.mine');

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-label font-semibold text-brand hover:bg-brand-soft"
    >
      <IconExternalLink className="size-4" />
      {t('open')}
    </a>
  );
}

type Say = (key: string, values: { date: string }) => string;

/** The key and day of each thing to say about a training: when it was taken, and until when or when it is due. */
function notes(item: MyTrainingItem, late: boolean): [string, string][] {
  const rows: [string, string | null][] = [
    ['completedOn', item.completedOn],
    ['expiresOn', item.status === 'done' ? item.expiresOn : null],
    ['renewOn', item.status === 'renew' ? item.expiresOn : null],
    [late ? 'lateSince' : 'dueOn', item.status === 'todo' ? item.dueOn : null],
  ];
  return rows.flatMap(([key, date]) => (date ? [[key, date] as [string, string]] : []));
}

/** What to say under a training: when it was done and until when, or when it is due. Red once it is late. */
function Note({ item }: { item: MyTrainingItem }) {
  const t = useTranslations('training.mine') as unknown as Say;
  const dayOf = useDay();
  const late =
    item.status === 'todo' && item.dueOn !== null && item.dueOn < new Date().toISOString();
  const lines = notes(item, late).map(([key, date]) => t(key, { date: dayOf(date) }));

  return (
    <span className={cx('text-label', late ? 'text-danger' : 'text-fg-muted')}>
      {lines.join(' · ')}
    </span>
  );
}

/** What can be done with a training: take it and mark it done, or take the mark back. */
function Actions(props: { item: MyTrainingItem; canAct: boolean; personId?: string }) {
  const t = useTranslations('training.mine');
  const { item, canAct, personId } = props;
  const [complete, completing] = useCompleteTrainingMutation();
  const [reopen, reopening] = useReopenTrainingMutation();
  const needsDoing = item.status !== 'done';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsDoing && item.url && <OpenLink url={item.url} />}
      {canAct && needsDoing && (
        <Button
          size="sm"
          isLoading={completing.isLoading}
          onPress={() => void complete({ id: item.id, personId })}
        >
          {t(item.status === 'renew' ? 'markDoneAgain' : 'markDone')}
        </Button>
      )}
      {canAct && item.completedOn && (
        <Button
          color="tertiary"
          size="sm"
          isLoading={reopening.isLoading}
          onPress={() => void reopen({ id: item.id, personId })}
        >
          {t('undo')}
        </Button>
      )}
    </div>
  );
}

function Row(props: { item: MyTrainingItem; canAct: boolean; personId?: string }) {
  const { item } = props;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-card border border-line/70 bg-surface p-4 shadow-card">
      <Mark done={item.status === 'done' || item.status === 'renew'} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
          {item.name}
          {item.repeatsYearly && <YearlyBadge />}
        </p>
        {item.about && <p className="text-label text-fg-muted">{item.about}</p>}
        <Note item={item} />
      </div>
      <Actions {...props} />
    </li>
  );
}

function YearlyBadge() {
  const t = useTranslations('training');
  return <Badge>{t('yearly')}</Badge>;
}

/**
 * The trainings of one person, each to take and mark done. For the signed-in person, or, when an admin names `personId`,
 * for someone else.
 */
export function TrainingList(props: {
  items: MyTrainingItem[];
  canAct: boolean;
  personId?: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {props.items.map((item) => (
        <Row key={item.id} item={item} canAct={props.canAct} personId={props.personId} />
      ))}
    </ul>
  );
}
