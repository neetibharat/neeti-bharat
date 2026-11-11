'use client';

import { IconX } from '@tabler/icons-react';
import type { ProofOverviewResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Link } from '@/i18n/navigation';
import { useGetEvidenceQuery } from '@/lib/api/evidence-api';
import { AddRequirementButton } from './add-requirement-button';
import { ArchivedRequirements } from '@/components/proof/archived-requirements';
import { GeneralProof } from './general-proof';

/** The control the list is narrowed to, with what only makes sense for one control: adding, archived and other proof. */
export function ControlFocus(props: {
  controlId: string;
  control: ProofOverviewResponse['control'];
}) {
  const t = useTranslations('proofPage.control');
  const { controlId, control } = props;
  const { canEdit } = useCan();
  const { data } = useGetEvidenceQuery(controlId);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={control?.title ?? t('fallback')}
        description={t('showing')}
        actions={
          <>
            {canEdit && <AddRequirementButton controlId={controlId} />}
            <Link
              href="/proof"
              className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-label font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              <IconX className="size-4" />
              {t('showAll')}
            </Link>
          </>
        }
      >
        {control && <Badge>{control.ruleId}</Badge>}
      </Card>
      {data && <GeneralProof controlId={controlId} proof={data.other} />}
      {data && data.archived.length > 0 && (
        <Card title={t('archived')}>
          <ArchivedRequirements requirements={data.archived} />
        </Card>
      )}
    </div>
  );
}
