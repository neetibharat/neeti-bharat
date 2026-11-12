'use client';

import { LOGO_EXTENSIONS, LOGO_MAX_BYTES } from '@dpdp-kit/shared';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
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

/** Checks a picked file and sends it. `problem` is the reason it was not accepted, already worded. */
function useLogoUpload() {
  const t = useTranslations('profile.logo');
  const errorMessage = useErrorMessage();
  const [save, { isLoading }] = useSetCompanyLogoMutation();
  const [problem, setProblem] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    setProblem(null);
    if (!file) return;
    const issue = checkProofFile(file, RULES);
    if (issue) {
      const values = {
        max: formatFileSize(RULES.maxBytes),
        types: listAllowedTypes(RULES.allowedTypes),
      };
      return setProblem(t(`problems.${issue}`, values));
    }
    const result = await save(file);
    if ('error' in result) setProblem(errorMessage(result.error));
  }

  return { upload, isUploading: isLoading, problem };
}

/** The logo at a good size, or the first letter of the name until there is one. */
function LogoPreview({ name, url }: { name: string; url?: string }) {
  const t = useTranslations('profile.logo');

  return (
    <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-card border border-line bg-brand-soft text-heading font-semibold text-brand">
      {url ? (
        // The picture is on file storage at a short-lived link, so the image optimiser cannot be used.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={t('alt')} className="size-full bg-surface object-contain p-1" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

function RemoveLogoButton() {
  const t = useTranslations('profile.logo');
  const [remove, { isLoading }] = useRemoveCompanyLogoMutation();

  return (
    <ConfirmDialog
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
  );
}

function LogoButtons(props: {
  hasLogo: boolean;
  isUploading: boolean;
  onPick: (file: File | undefined) => void;
}) {
  const t = useTranslations('profile.logo');

  return (
    <div className="flex items-center gap-1">
      <FileTrigger
        acceptedFileTypes={pickerTypes(RULES.allowedTypes)}
        onSelect={(list) => props.onPick(list?.[0])}
      >
        <Button color="secondary" size="sm" iconLeading={IconUpload} isLoading={props.isUploading}>
          {t(props.hasLogo ? 'replace' : 'upload')}
        </Button>
      </FileTrigger>
      {props.hasLogo && <RemoveLogoButton />}
    </div>
  );
}

/**
 * The company logo on General settings: the picture, a button to choose another, and one to remove it. Without file
 * storage it says so instead of offering an upload.
 */
export function LogoTile({ name }: { name: string }) {
  const t = useTranslations('profile.logo');
  const { data: storage } = useGetStorageQuery();
  const { data } = useGetCompanyLogoQuery(undefined, { refetchOnMountOrArgChange: true });
  const { upload, isUploading, problem } = useLogoUpload();
  const storageOff = storage !== undefined && !storage.enabled;

  return (
    <div className="flex flex-col items-start gap-3">
      <LogoPreview name={name} url={data?.logo?.url} />
      {storageOff ? (
        <Alert tone="info">{t('off')}</Alert>
      ) : (
        <LogoButtons
          hasLogo={Boolean(data?.logo)}
          isUploading={isUploading}
          onPick={(file) => void upload(file)}
        />
      )}
      {problem && <Alert tone="error">{problem}</Alert>}
    </div>
  );
}
