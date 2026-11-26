'use client';

import { IconPlus } from '@tabler/icons-react';
import type { ProofRequirementResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EvidenceForm } from '@/components/proof/evidence-form';
import { EvidenceRow } from '@/components/proof/evidence-row';
import { splitProof } from '@/lib/filled-template';
import { FileDropzone } from './file-dropzone';

/** The proof given for one requirement, newest first, with a way to add a link, a note or a file. */
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
        <FileDropzone controlId={controlId} proofRequirementId={requirement.id} />
      </div>
    </Card>
  );
}

function Rows(props: { controlId: string; items: ProofRequirementResponse['evidence'] }) {
  return (
    <ul className="divide-y divide-line rounded-control border border-line">
      {props.items.map((item) => (
        <EvidenceRow key={item.id} controlId={props.controlId} item={item} />
      ))}
    </ul>
  );
}

function Group(props: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-subtitle font-semibold text-fg">{props.title}</h3>
        <p className="text-label text-fg-muted">{props.hint}</p>
      </div>
      {props.children}
    </section>
  );
}

/** For a requirement with a template: the filled template on its own, first, and the other proof under it. */
function ProofList(props: { controlId: string; requirement: ProofRequirementResponse }) {
  const t = useTranslations('proofPage.proof');
  const { controlId, requirement } = props;
  const { filled, other, templateFile } = splitProof(requirement.evidence, requirement.description);

  if (!templateFile) {
    if (other.length === 0) return <p className="text-body text-fg-muted">{t('empty')}</p>;
    return <Rows controlId={controlId} items={other} />;
  }

  return (
    <>
      <Group title={t('filledTitle')} hint={t('filledHint')}>
        {filled.length === 0 ? (
          <p className="text-body text-fg-muted">{t('filledEmpty')}</p>
        ) : (
          <Rows controlId={controlId} items={filled} />
        )}
      </Group>
      <Group title={t('otherTitle')} hint={t('otherHint')}>
        {other.length === 0 ? (
          <p className="text-body text-fg-muted">{t('empty')}</p>
        ) : (
          <Rows controlId={controlId} items={other} />
        )}
      </Group>
    </>
  );
}
