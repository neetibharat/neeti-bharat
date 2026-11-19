'use client';

import { IconArchive, IconArchiveOff } from '@tabler/icons-react';
import type { VendorResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { useArchiveVendorMutation, useRestoreVendorMutation } from '@/lib/api/vendors-api';

/**
 * Takes a vendor out of use, or brings it back. Nothing is deleted either way, so it does not ask first.
 * In a list it is an icon; on the vendor's own page it says what it does.
 */
export function ArchiveVendorButton(props: { vendor: VendorResponse; labelled?: boolean }) {
  const t = useTranslations('vendors');
  const [archive, archiving] = useArchiveVendorMutation();
  const [restore, restoring] = useRestoreVendorMutation();
  const { vendor, labelled } = props;
  const archived = vendor.archivedAt !== null;
  const label = t(archived ? 'restore' : 'archive', { name: vendor.name });

  return (
    <Button
      color={labelled ? 'secondary' : 'tertiary'}
      size="sm"
      isIconOnly={!labelled}
      iconLeading={archived ? IconArchiveOff : IconArchive}
      isLoading={archiving.isLoading || restoring.isLoading}
      aria-label={labelled ? undefined : label}
      onPress={() => void (archived ? restore(vendor.id) : archive(vendor.id))}
    >
      {labelled ? t(archived ? 'restoreShort' : 'archiveShort') : undefined}
    </Button>
  );
}
