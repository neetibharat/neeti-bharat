'use client';

import { REQUEST_TEXT_MAX_LENGTH, type RequestResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCan } from '@/components/providers/user-provider';
import { useCloseRequestMutation } from '@/lib/api/requests-api';
import { closeBlocker } from '@/lib/request-tasks';

/** The reply as it was recorded, and who closed the request and when. */
function SavedReply({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.reply');
  const format = useFormatter();
  const when = request.closedAt
    ? format.dateTime(new Date(request.closedAt), { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body whitespace-pre-line text-fg">{request.replyNote}</p>
      <p className="text-caption text-fg-muted">
        {t('closedBy', { name: request.closedByName ?? '', date: when })}
      </p>
    </div>
  );
}

/** The reply and the button that closes the request. Closing asks first, since a closed request cannot be changed. */
function CloseForm({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.reply');
  const [reply, setReply] = useState('');
  const [close] = useCloseRequestMutation();
  const blocker = closeBlocker(request);
  const ready = blocker === null && reply.trim() !== '';

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('label')}
        hint={t('hint')}
        value={reply}
        onChange={setReply}
        maxLength={REQUEST_TEXT_MAX_LENGTH}
        rows={6}
      />
      {blocker && <Alert tone="info">{t(`blocked.${blocker}`)}</Alert>}
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={<Button isDisabled={!ready}>{t('close')}</Button>}
          title={t('confirmTitle')}
          description={t('confirmText')}
          confirmLabel={t('close')}
          tone="primary"
          onConfirm={() => close({ id: request.id, replyNote: reply.trim() })}
        />
      </div>
    </div>
  );
}

/** Closing sends nothing: the reply is written here and saved with the request, its tasks and its history. */
export function RequestReplyCard({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.reply');
  const { canEdit } = useCan();
  const isClosed = request.closedAt !== null;
  if (!isClosed && !canEdit) return null;

  return (
    <Card title={t('title')} description={t('description')}>
      {isClosed ? <SavedReply request={request} /> : <CloseForm request={request} />}
    </Card>
  );
}
