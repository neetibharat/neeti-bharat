'use client';

import type { BreachResponse, UpdateBreachRequest } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { useCan } from '@/components/providers/user-provider';
import { useUpdateBreachMutation } from '@/lib/api/breaches-api';
import { breachRequestOf } from '@/lib/breach-form';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Who deals with the breach. Editors change it while the breach is open and it is saved as soon as it changes. */
export function BreachAssignee({ breach }: { breach: BreachResponse }) {
  const { canEdit } = useCan();
  if (canEdit && breach.closedAt === null) return <AssigneeEditor breach={breach} />;
  return <AssigneeReadout breach={breach} />;
}

function AssigneeReadout({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches.detail');

  return (
    <dl className="mt-4">
      <div>
        <dt className="text-label font-medium text-fg-muted">{t('assignee')}</dt>
        <dd className="mt-0.5 text-body text-fg">{breach.assignee?.name ?? t('unassigned')}</dd>
        {breach.assignee ? null : (
          <p className="text-caption text-fg-subtle">{t('unassignedHint')}</p>
        )}
      </div>
    </dl>
  );
}

function AssigneeEditor({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches');
  const errorMessage = useErrorMessage();
  const { change, error } = useAssigneeSave(breach);

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <AssigneeSelect
        label={t('detail.assignee')}
        noneLabel={t('form.assigneeNone')}
        value={breach.assignee?.id ?? null}
        onChange={change}
      />
      {breach.assignee ? null : (
        <p className="text-caption text-fg-subtle">{t('detail.unassignedHint')}</p>
      )}
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
    </div>
  );
}

/**
 * Saves the person as soon as they are chosen. The breach as it stands is kept in a draft here, so a second change made
 * before the first has come back from the server still includes the first.
 */
function useAssigneeSave(breach: BreachResponse) {
  const [update, { error }] = useUpdateBreachMutation();
  const draft = useRef<UpdateBreachRequest>(breachRequestOf(breach));
  const server = breachRequestOf(breach);
  // A change that arrived from elsewhere replaces the draft.
  useEffect(() => {
    draft.current = server;
  }, [JSON.stringify(server)]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (assigneeId: string | null) => {
    draft.current = { ...draft.current, assigneeId };
    void update({ id: breach.id, ...draft.current });
  };
  return { change, error };
}
