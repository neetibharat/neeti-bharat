'use client';

import type { StorageStatusResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { DropZone } from '@/components/base/drop-zone/drop-zone';
import { useCan } from '@/components/providers/user-provider';
import { useAddEvidenceFileMutation } from '@/lib/api/evidence-api';
import { useGetStorageQuery } from '@/lib/api/storage-api';
import { formatFileSize } from '@/lib/file-size';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { checkProofFile, listAllowedTypes, pickerTypes } from '@/lib/proof-file';

/** Where files are added as proof. Auditors only read, so they do not see it. */
export function FileDropzone(props: { controlId: string; proofRequirementId?: string }) {
  const { canEdit } = useCan();
  const { data: storage } = useGetStorageQuery();
  if (!canEdit || !storage) return null;

  return storage.enabled ? <LiveDropzone {...props} storage={storage} /> : <SetUpNotice />;
}

/** Storage is not configured: the zone stays, switched off, and says why. */
function SetUpNotice() {
  const t = useTranslations('proofPage.files');

  return (
    <DropZone
      isDisabled
      label={t('off')}
      hint={t('offHint')}
      buttonLabel={t('choose')}
      loadingLabel={t('uploading')}
      onFiles={() => undefined}
    />
  );
}

function LiveDropzone(props: {
  controlId: string;
  proofRequirementId?: string;
  storage: StorageStatusResponse;
}) {
  const { controlId, proofRequirementId, storage } = props;
  const t = useTranslations('proofPage.files');
  const errorMessage = useErrorMessage();
  const [add, { isLoading }] = useAddEvidenceFileMutation();
  const [problem, setProblem] = useState<string | null>(null);

  /** One file at a time. The first that fails stops the rest and says why. */
  async function send(files: File[]) {
    setProblem(null);
    for (const file of files) {
      const issue = checkProofFile(file, storage);
      if (issue) return setProblem(t(`problems.${issue}`, values(file.name, storage)));
      const result = await add({ controlId, file, proofRequirementId });
      if ('error' in result) return setProblem(errorMessage(result.error));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <DropZone
        label={t('title')}
        hint={t('hint', {
          types: listAllowedTypes(storage.allowedTypes),
          max: formatFileSize(storage.maxBytes),
        })}
        buttonLabel={t('choose')}
        loadingLabel={t('uploading')}
        isLoading={isLoading}
        accept={pickerTypes(storage.allowedTypes)}
        onFiles={send}
      />
      {problem ? <Alert tone="error">{problem}</Alert> : null}
    </div>
  );
}

const values = (name: string, storage: StorageStatusResponse) => ({
  name,
  max: formatFileSize(storage.maxBytes),
  types: listAllowedTypes(storage.allowedTypes),
});
