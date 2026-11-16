'use client';

import type { EvidenceResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EvidenceForm } from '@/components/proof/evidence-form';
import { EvidenceRow } from '@/components/proof/evidence-row';
import { FileDropzone } from '@/components/proof/file-dropzone';

/** Proof on a control that is not for any one requirement, with a way to add more. */
export function GeneralProof(props: { controlId: string; proof: EvidenceResponse[] }) {
  const { canEdit } = useCan();
  const t = useTranslations('frameworks.proof');
  const [adding, setAdding] = useState(false);
  if (!props.proof.length && !canEdit) return null;
  const addButton =
    canEdit && !adding ? (
      <Button color="secondary" size="sm" onPress={() => setAdding(true)}>
        {t('general.add')}
      </Button>
    ) : undefined;

  return (
    <Card title={t('general.title')} description={t('general.hint')} actions={addButton}>
      <div className="flex flex-col gap-3">
        {adding && (
          <div className="rounded-control border border-line p-3">
            <EvidenceForm controlId={props.controlId} onDone={() => setAdding(false)} />
          </div>
        )}
        {props.proof.length > 0 && (
          <ul className="divide-y divide-line rounded-control border border-line">
            {props.proof.map((item) => (
              <EvidenceRow key={item.id} controlId={props.controlId} item={item} />
            ))}
          </ul>
        )}
        <FileDropzone controlId={props.controlId} />
      </div>
    </Card>
  );
}
