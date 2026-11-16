'use client';

import { IconArchiveOff } from '@tabler/icons-react';
import type { ArchivedRequirementResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useRestoreRequirementMutation } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Requirements that were archived, each with a way to bring it back. */
export function ArchivedRequirements(props: { requirements: ArchivedRequirementResponse[] }) {
  const t = useTranslations('frameworks.proof');
  if (!props.requirements.length)
    return <p className="text-body text-fg-muted">{t('archivedEmpty')}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-fg-muted">{t('archivedHint')}</p>
      <ul className="flex flex-col gap-3">
        {props.requirements.map((requirement) => (
          <ArchivedRow key={requirement.id} requirement={requirement} />
        ))}
      </ul>
    </div>
  );
}

function ArchivedRow(props: { requirement: ArchivedRequirementResponse }) {
  const t = useTranslations('frameworks.proof');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const [restore, { isLoading, error }] = useRestoreRequirementMutation();
  const { requirement } = props;

  return (
    <li className="flex flex-col gap-2 rounded-control border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-medium text-fg">{requirement.title}</p>
          <p className="mt-0.5 text-caption text-fg-subtle">
            {t(`frequencies.${requirement.frequency}`)}
          </p>
        </div>
        {canEdit && (
          <Button
            color="secondary"
            size="sm"
            iconLeading={IconArchiveOff}
            isLoading={isLoading}
            onPress={() => void restore(requirement.id)}
          >
            {t('restore')}
          </Button>
        )}
      </div>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
    </li>
  );
}
