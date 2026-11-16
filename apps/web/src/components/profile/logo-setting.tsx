'use client';

import { LOGO_EXTENSIONS, LOGO_MAX_BYTES } from '@dpdp-kit/shared';
import { IconTrash } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { DropZone } from '@/components/base/drop-zone/drop-zone';
import {
  useGetCompanyLogoQuery,
  useRemoveCompanyLogoMutation,
  useSetCompanyLogoMutation,
} from '@/lib/api/company-logo-api';
import { useGetStorageQuery } from '@/lib/api/storage-api';
import { formatFileSize } from '@/lib/file-size';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { checkProofFile, listAllowedTypes, pickerTypes } from '@/lib/proof-file';

const RULES = { maxBytes: LOGO_MAX_BYTES, allowedTypes: [...LOGO_EXTENSIONS] };

/** The picture, a place to drop a new one, and a way to remove it. Without file storage it says so instead. */
export function LogoPicker() {
  const t = useTranslations('profile.logo');
  const { data: storage } = useGetStorageQuery();
  const { data } = useGetCompanyLogoQuery(undefined, { refetchOnMountOrArgChange: true });

  return (
    <div className="flex flex-col gap-4">
      {data?.logo && <CurrentLogo url={data.logo.url} fileName={data.logo.fileName} />}
      {storage && !storage.enabled ? <Alert tone="info">{t('off')}</Alert> : <LogoDropzone />}
    </div>
  );
}

function CurrentLogo({ url, fileName }: { url: string; fileName: string }) {
  const t = useTranslations('profile.logo');
  const [remove, { isLoading }] = useRemoveCompanyLogoMutation();

  return (
    <div className="flex items-center justify-between gap-4 rounded-control border border-line bg-surface-muted/50 p-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* The picture is on file storage at a short-lived link, so the image optimiser cannot be used. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={t('alt')}
          className="h-14 max-w-40 rounded-control bg-surface object-contain"
        />
        <p className="truncate text-label text-fg-muted">{fileName}</p>
      </div>
      <ConfirmDialog
        tone="danger"
        trigger={
          <Button
            color="tertiary"
            size="sm"
            isIconOnly
            iconLeading={IconTrash}
            aria-label={t('remove')}
            isLoading={isLoading}
          />
        }
        title={t('removeTitle')}
        description={t('removeBody')}
        confirmLabel={t('remove')}
        onConfirm={() => remove()}
      />
    </div>
  );
}

function LogoDropzone() {
  const t = useTranslations('profile.logo');
  const errorMessage = useErrorMessage();
  const [save, { isLoading }] = useSetCompanyLogoMutation();
  const [problem, setProblem] = useState<string | null>(null);

  async function send([file]: File[]) {
    setProblem(null);
    if (!file) return;
    const issue = checkProofFile(file, RULES);
    if (issue) {
      return setProblem(
        t(`problems.${issue}`, {
          max: formatFileSize(RULES.maxBytes),
          types: listAllowedTypes(RULES.allowedTypes),
        }),
      );
    }
    const result = await save(file);
    if ('error' in result) setProblem(errorMessage(result.error));
  }

  return (
    <div className="flex flex-col gap-3">
      <DropZone
        label={t('drop')}
        buttonLabel={t('choose')}
        loadingLabel={t('uploading')}
        isLoading={isLoading}
        accept={pickerTypes(RULES.allowedTypes)}
        onFiles={send}
      />
      {problem ? <Alert tone="error">{problem}</Alert> : null}
    </div>
  );
}
