'use client';

import { IconPlus } from '@tabler/icons-react';
import type { ProofRequirementResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EvidenceForm } from '@/components/proof/evidence-form';
import { EvidenceRow } from '@/components/proof/evidence-row';
import { FileDropzone } from './file-dropzone';

/** The proof given for one requirement, newest first, with a way to add a link or a note. */
export function RequirementProof(props: {
  controlId: string;
  requirement: ProofRequirementResponse;
}) {
  const { controlId, requirement } = props;
  const { canEdit } = useCan();
  const t = useTranslations('proofPage.proof');
  const [adding, setAdding] = useState(false);
  const addButton =
    canEdit && !adding ? (
      <Button color="secondary" size="sm" iconLeading={IconPlus} onPress={() => setAdding(true)}>
        {t('add')}
      </Button>
    ) : undefined;

  return (
    <Card title={t('title')} description={t('description')} actions={addButton}>
      <div className="flex flex-col gap-4">
        {adding && (
          <div className="rounded-control border border-line p-3">
            <EvidenceForm
              controlId={controlId}
              proofRequirementId={requirement.id}
              initialTitle={requirement.title}
              onDone={() => setAdding(false)}
            />
          </div>
        )}
        {!adding && <ProofList controlId={controlId} requirement={requirement} />}
        <FileDropzone />
      </div>
    </Card>
  );
}

function ProofList(props: { controlId: string; requirement: ProofRequirementResponse }) {
  const t = useTranslations('proofPage.proof');
  const { controlId, requirement } = props;
  if (requirement.evidence.length === 0) {
    return <p className="text-body text-fg-muted">{t('empty')}</p>;
  }

  return (
    <ul className="divide-y divide-line rounded-control border border-line">
      {requirement.evidence.map((item) => (
        <EvidenceRow key={item.id} controlId={controlId} item={item} />
      ))}
    </ul>
  );
}
