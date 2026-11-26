'use client';

import type { RequestResponse, UpdateRequestRequest } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import { useCan } from '@/components/providers/user-provider';
import { useUpdateRequestMutation } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { requestUpdateOf } from '@/lib/request-form';

/** Who deals with the request. Editors change it while the request is open and it is saved as soon as it changes. */
export function RequestAssignee({ request }: { request: RequestResponse }) {
  const { canEdit } = useCan();
  if (canEdit && request.closedAt === null) return <AssigneeEditor request={request} />;
  return <AssigneeReadout request={request} />;
}

function AssigneeReadout({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.detail');

  return (
    <dl className="mt-4">
      <div>
        <dt className="text-label font-medium text-fg-muted">{t('assignee')}</dt>
        <dd className="mt-0.5 text-body text-fg">{request.assignee?.name ?? t('unassigned')}</dd>
        {request.assignee ? null : (
          <p className="text-caption text-fg-subtle">{t('unassignedHint')}</p>
        )}
      </div>
    </dl>
  );
}

function AssigneeEditor({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests');
  const errorMessage = useErrorMessage();
  const { change, error } = useAssigneeSave(request);

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <AssigneeSelect
        label={t('detail.assignee')}
        noneLabel={t('form.assigneeNone')}
        value={request.assignee?.id ?? null}
        onChange={change}
      />
      {request.assignee ? null : (
        <p className="text-caption text-fg-subtle">{t('detail.unassignedHint')}</p>
      )}
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
    </div>
  );
}

/**
 * Saves the person as soon as they are chosen. The request as it stands is kept in a draft here, so a second change made
 * before the first has come back from the server still includes the first.
 */
function useAssigneeSave(request: RequestResponse) {
  const [update, { error }] = useUpdateRequestMutation();
  const draft = useRef<UpdateRequestRequest>(requestUpdateOf(request));
  const server = requestUpdateOf(request);
  // A change that arrived from elsewhere replaces the draft.
  useEffect(() => {
    draft.current = server;
  }, [JSON.stringify(server)]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (assigneeId: string | null) => {
    draft.current = { ...draft.current, assigneeId };
    void update({ id: request.id, ...draft.current });
  };
  return { change, error };
}
