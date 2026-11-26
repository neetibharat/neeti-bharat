'use client';

import {
  EVIDENCE_NOTE_MAX_LENGTH,
  EVIDENCE_TITLE_MAX_LENGTH,
  type AddEvidenceRequest,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { useAddEvidenceMutation } from '@/lib/api/evidence-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';

/** Files are added by the drop zone, so the form only has the two kinds that are typed. */
const TYPED_KINDS = ['link', 'note'] as const satisfies readonly AddEvidenceRequest['kind'][];

/** What is typed so far: the kind of proof, its title, and its address or note. */
interface Draft {
  kind: AddEvidenceRequest['kind'];
  title: string;
  detail: string;
}

export interface EvidenceFormProps {
  controlId: string;
  /** The requirement this is proof of. Leave out for general proof. */
  proofRequirementId?: string;
  /** What the title starts as. */
  initialTitle?: string;
  onDone: () => void;
}

/** Adds a link or a note as proof, for a requirement or for the control in general. */
export function EvidenceForm({
  controlId,
  proofRequirementId,
  initialTitle = '',
  onDone,
}: EvidenceFormProps) {
  const t = useTranslations('frameworks.evidence');
  const errorMessage = useErrorMessage();
  const [add, { isLoading, error }] = useAddEvidenceMutation();
  const [draft, patch] = useFormDraft<Draft>({ kind: 'link', title: initialTitle, detail: '' });
  const canAdd = draft.title.trim() !== '' && draft.detail.trim() !== '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    const request = toRequest(draft, proofRequirementId);
    const result = await add({ controlId, ...request });
    if (!('error' in result)) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Fields draft={draft} onChange={patch} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('form.cancel')}
        submitLabel={t('form.submit')}
        onCancel={onDone}
        isDisabled={!canAdd}
        isLoading={isLoading}
      />
    </form>
  );
}

const toRequest = (
  { kind, title, detail }: Draft,
  proofRequirementId?: string,
): AddEvidenceRequest => ({
  ...(kind === 'link'
    ? { kind, title: title.trim(), url: detail.trim() }
    : { kind, title: title.trim(), note: detail.trim() }),
  ...(proofRequirementId && { proofRequirementId }),
});

function Fields({ draft, onChange }: { draft: Draft; onChange: (change: Partial<Draft>) => void }) {
  const t = useTranslations('frameworks.evidence');

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Select
          label={t('form.kind')}
          options={TYPED_KINDS.map((id) => ({ id, label: t(`kinds.${id}`) }))}
          selectedKey={draft.kind}
          onSelectionChange={(kind) => onChange({ kind, detail: '' })}
        />
        <Input
          label={t('form.title')}
          value={draft.title}
          onChange={(title) => onChange({ title })}
          maxLength={EVIDENCE_TITLE_MAX_LENGTH}
        />
      </div>
      {draft.kind === 'link' ? (
        <Input
          label={t('form.url')}
          placeholder="https://"
          value={draft.detail}
          onChange={(detail) => onChange({ detail })}
        />
      ) : (
        <Textarea
          label={t('form.note')}
          value={draft.detail}
          onChange={(detail) => onChange({ detail })}
          maxLength={EVIDENCE_NOTE_MAX_LENGTH}
          rows={3}
        />
      )}
    </>
  );
}
