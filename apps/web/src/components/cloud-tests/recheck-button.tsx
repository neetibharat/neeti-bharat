'use client';

import { IconRefresh } from '@tabler/icons-react';
import type { CheckId } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useCan } from '@/components/providers/user-provider';
import { useRunConnectionMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/**
 * Runs some checks again, such as one just fixed, without reading everything. The rest stay as the last run found them.
 * Only people who can change things see it.
 */
export function RecheckButton({
  connectionId,
  checks,
  label,
  onRan,
}: {
  connectionId: string;
  checks: readonly CheckId[];
  label: string;
  onRan: (runId: string) => void;
}) {
  const t = useTranslations('cloudTests.recheck');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const [run, { isLoading, error }] = useRunConnectionMutation();
  if (!canEdit) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        color="tertiary"
        size="sm"
        iconLeading={IconRefresh}
        isLoading={isLoading}
        onPress={() =>
          void run({ id: connectionId, checks: [...checks] }).then(
            (result) => result.data && onRan(result.data.id),
          )
        }
      >
        {isLoading ? t('running') : label}
      </Button>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
    </div>
  );
}
