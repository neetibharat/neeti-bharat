'use client';

import { IconCircleCheck } from '@tabler/icons-react';
import { REQUEST_NOTE_MAX_LENGTH, type RequestResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCan } from '@/components/providers/user-provider';
import { useVerifyIdentityMutation } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Who checked the identity and when, with the note they wrote. */
function Verified({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.identity');
  const format = useFormatter();
  const when = request.identityVerifiedAt
    ? format.dateTime(new Date(request.identityVerifiedAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-body font-medium text-success">
        <IconCircleCheck className="size-5" />
        {t('doneBy', { name: request.identityVerifiedByName ?? '', date: when })}
      </p>
      <p className="text-label whitespace-pre-line text-fg">
        {request.identityNote ?? <span className="text-fg-subtle">{t('noNote')}</span>}
      </p>
    </div>
  );
}

function VerifyForm({ requestId }: { requestId: string }) {
  const t = useTranslations('requests.identity');
  const errorMessage = useErrorMessage();
  const [note, setNote] = useState('');
  const [verify, { isLoading, error }] = useVerifyIdentityMutation();

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('note')}
        hint={t('noteHint')}
        value={note}
        onChange={setNote}
        maxLength={REQUEST_NOTE_MAX_LENGTH}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end">
        <Button
          isLoading={isLoading}
          onPress={() => void verify({ id: requestId, note: note.trim() || undefined })}
        >
          {t('verify')}
        </Button>
      </div>
    </div>
  );
}

/** The identity check that starts the work: a note on how it was done, and the button that marks it done. */
export function RequestIdentityCard({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.identity');
  const { canEdit } = useCan();
  const canVerify = canEdit && request.closedAt === null;

  return (
    <Card title={t('title')} description={t('description')}>
      {request.identityVerifiedAt ? (
        <Verified request={request} />
      ) : canVerify ? (
        <VerifyForm requestId={request.id} />
      ) : (
        <p className="text-body text-fg-muted">{t('notDone')}</p>
      )}
    </Card>
  );
}
