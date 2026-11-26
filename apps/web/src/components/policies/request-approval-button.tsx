'use client';

import { CHANGELOG_MAX_LENGTH } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { Textarea } from '@/components/base/textarea/textarea';
import { useChangePolicyStatusMutation } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Asks for approval, with a note on what changed for the approver to read. */
export function RequestApprovalButton({ policyId }: { policyId: string }) {
  const t = useTranslations('policies.requestApproval');

  return (
    <Modal trigger={<Button>{t('open')}</Button>} title={t('title')} description={t('description')}>
      {(close) => <RequestForm policyId={policyId} onDone={close} />}
    </Modal>
  );
}

function RequestForm({ policyId, onDone }: { policyId: string; onDone: () => void }) {
  const t = useTranslations('policies.requestApproval');
  const errorMessage = useErrorMessage();
  const [change, { isLoading, error }] = useChangePolicyStatusMutation();
  const [changelog, setChangelog] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('changelog')}
        value={changelog}
        onChange={setChangelog}
        maxLength={CHANGELOG_MAX_LENGTH}
        rows={3}
        autoFocus
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={onDone}>
          {t('cancel')}
        </Button>
        <Button
          isLoading={isLoading}
          onPress={async () => {
            const result = await change({
              policyId,
              status: 'in_review',
              changelog: changelog.trim() || undefined,
            });
            if (!('error' in result)) onDone();
          }}
        >
          {t('submit')}
        </Button>
      </div>
    </div>
  );
}
