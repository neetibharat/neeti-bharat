'use client';

import { IconDownload, IconFile, IconLink, IconNote, IconTrash } from '@tabler/icons-react';
import type { EvidenceResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { useCan } from '@/components/providers/user-provider';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { CheckProofButton } from '@/components/ai-tools/check-proof-button';
import { useDownloadEvidenceMutation, useRemoveEvidenceMutation } from '@/lib/api/evidence-api';
import { formatFileSize } from '@/lib/file-size';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

const KIND_ICONS = { link: IconLink, note: IconNote, file: IconFile } as const;

/** One piece of proof: what it is, who added it and when, and for those who can edit, a way to remove it. */
export function EvidenceRow(props: { controlId: string; item: EvidenceResponse }) {
  const { canEdit } = useCan();
  const t = useTranslations('frameworks.evidence');
  const format = useFormatter();
  const { item } = props;
  const date = format.dateTime(new Date(item.createdAt), { dateStyle: 'medium' });
  const KindIcon = KIND_ICONS[item.kind];

  return (
    <li className="flex items-start gap-3 p-3">
      <KindIcon className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg">{item.title}</p>
        {item.url && <ExternalLink url={item.url} />}
        {item.kind === 'file' && <FileDetails controlId={props.controlId} item={item} />}
        {item.note && (
          <p className="mt-0.5 text-label whitespace-pre-wrap text-fg-muted">{item.note}</p>
        )}
        <p className="mt-1 text-caption text-fg-subtle">
          {t('addedBy', { name: item.addedByName, date })}
        </p>
      </div>
      <CheckProofButton controlId={props.controlId} item={item} />
      {canEdit && <RemoveEvidence controlId={props.controlId} item={item} />}
    </li>
  );
}

/** The bin on a piece of proof. Asks first, because the control may stop counting as done. */
function RemoveEvidence({ controlId, item }: { controlId: string; item: EvidenceResponse }) {
  const t = useTranslations('frameworks.evidence');
  const [remove] = useRemoveEvidenceMutation();

  return (
    <ConfirmDialog
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconTrash}
          aria-label={t('remove')}
        />
      }
      title={t('removeTitle', { title: item.title })}
      description={t('removeBody')}
      confirmLabel={t('removeConfirm')}
      onConfirm={() => remove({ controlId, evidenceId: item.id })}
    />
  );
}

/** A link opens in a new tab, and gives the page no handle back to this one. */
function ExternalLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block truncate text-label text-brand underline-offset-2 hover:underline"
    >
      {url}
    </a>
  );
}

/** A file's name and size, and a button that fetches a short-lived link and saves the file. */
function FileDetails({ controlId, item }: { controlId: string; item: EvidenceResponse }) {
  const t = useTranslations('frameworks.evidence');
  const errorMessage = useErrorMessage();
  const [fetchLink, { isLoading, error }] = useDownloadEvidenceMutation();

  async function download() {
    const result = await fetchLink({ controlId, evidenceId: item.id });
    // The file arrives as an attachment, so the page stays where it is. A new tab would be blocked after the wait.
    if (result.data) window.location.assign(result.data.url);
  }

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="truncate text-label text-fg-muted">
        {t('fileMeta', { name: item.fileName ?? '', size: formatFileSize(item.fileSize ?? 0) })}
      </p>
      <Button
        color="secondary"
        size="sm"
        iconLeading={IconDownload}
        isLoading={isLoading}
        onPress={download}
      >
        {t('download')}
      </Button>
      {error ? (
        <Alert tone="error" className="w-full">
          {errorMessage(error)}
        </Alert>
      ) : null}
    </div>
  );
}
