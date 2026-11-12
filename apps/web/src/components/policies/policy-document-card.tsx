'use client';

import {
  customAnswerLabel,
  resolveDocument,
  tokenKeys,
  type PolicyDetailResponse,
  type PolicyDocument,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Link } from '@/i18n/navigation';
import { useSavePolicyContentMutation } from '@/lib/api/policy-edit-api';
import { isProfileKey } from '@/lib/guards';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { PolicyEditor, PolicyReader } from './policy-editor';

/** The text of a policy with each company answer filled in, in the shape the reader sees. */
export function useResolvedDocument(
  document: PolicyDocument,
  values: Readonly<Record<string, string>>,
): PolicyDocument {
  const tFields = useTranslations('profile.fields');
  return useMemo(
    () =>
      resolveDocument(document, values, (key) =>
        isProfileKey(key) ? tFields(`${key}.label`) : customAnswerLabel(key),
      ),
    [document, values, tFields],
  );
}

/** Whether the text is being edited, what has been typed so far, and saving it. */
function useDraft(policy: PolicyDetailResponse) {
  const [save, { isLoading, error }] = useSavePolicyContentMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(policy.content);

  return {
    editing,
    setDraft,
    isLoading,
    error,
    start: () => {
      setDraft(policy.content);
      setEditing(true);
    },
    cancel: () => setEditing(false),
    save: async () => {
      const result = await save({ policyId: policy.id, content: draft });
      if (!('error' in result)) setEditing(false);
    },
  };
}

/** The policy's text. Read it, and while the policy is a draft, edit it. The buttons are top right. */
export function PolicyDocumentCard({ policy }: { policy: PolicyDetailResponse }) {
  const t = useTranslations('policies.document');
  const draft = useDraft(policy);
  const { canEdit: mayEdit } = useCan();
  const canEdit = policy.status === 'draft' && mayEdit;
  const isLocked = policy.status !== 'draft' && mayEdit;
  const description = draft.editing ? t('editingHint') : isLocked ? t('locked') : t('description');

  return (
    <Card
      title={t('title')}
      description={description}
      actions={<CardButtons draft={draft} canEdit={canEdit} />}
    >
      <div className="flex flex-col gap-5">
        {draft.editing ? <Editing policy={policy} draft={draft} /> : <Reading policy={policy} />}
      </div>
    </Card>
  );
}

type Draft = ReturnType<typeof useDraft>;

function CardButtons({ draft, canEdit }: { draft: Draft; canEdit: boolean }) {
  const t = useTranslations('policies.document');

  if (draft.editing) {
    return (
      <>
        <Button color="secondary" onPress={draft.cancel}>
          {t('cancel')}
        </Button>
        <Button isLoading={draft.isLoading} onPress={draft.save}>
          {t('save')}
        </Button>
      </>
    );
  }
  return canEdit ? (
    <Button color="secondary" onPress={draft.start}>
      {t('edit')}
    </Button>
  ) : null;
}

function Editing({ policy, draft }: { policy: PolicyDetailResponse; draft: Draft }) {
  const errorMessage = useErrorMessage();

  return (
    <div className="flex flex-col gap-4">
      <PolicyEditor content={policy.content} onChange={draft.setDraft} />
      {draft.error ? <Alert tone="error">{errorMessage(draft.error)}</Alert> : null}
    </div>
  );
}

function Reading({ policy }: { policy: PolicyDetailResponse }) {
  const t = useTranslations('policies.document');
  const resolved = useResolvedDocument(policy.content, policy.values);
  const unanswered = tokenKeys(policy.content).some((key) => !policy.values[key]);

  return (
    <>
      <div className="rounded-control border border-line bg-surface-sunken/30 px-6 py-6 sm:px-10 sm:py-8">
        <PolicyReader document={resolved} className="max-w-3xl" />
      </div>
      {unanswered && (
        <p className="mt-4 text-label text-fg-muted">
          {t('fillIn')}{' '}
          <Link href="/settings/company-profile" className="font-medium text-brand hover:underline">
            {t('openProfile')}
          </Link>
        </p>
      )}
    </>
  );
}
