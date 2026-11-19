'use client';

import type { VendorResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { useCan } from '@/components/providers/user-provider';
import { ArchiveVendorButton } from './archive-vendor-button';
import { DataCell, StatusCell, VendorCell } from './vendor-cells';
import { VendorRiskBadge } from './vendor-risk';

function Head() {
  const t = useTranslations('vendors.columns');

  return (
    <TableHeader>
      <TableColumn isRowHeader>{t('vendor')}</TableColumn>
      <TableColumn>{t('status')}</TableColumn>
      <TableColumn>{t('risk')}</TableColumn>
      <TableColumn>{t('data')}</TableColumn>
      <TableColumn>{t('owner')}</TableColumn>
      <TableColumn>
        <span className="sr-only">{t('actions')}</span>
      </TableColumn>
    </TableHeader>
  );
}

function VendorRow({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const { canEdit } = useCan();

  return (
    <TableRow>
      <TableCell>
        <VendorCell vendor={vendor} />
      </TableCell>
      <TableCell>
        <StatusCell vendor={vendor} />
      </TableCell>
      <TableCell>
        <VendorRiskBadge vendor={vendor} />
      </TableCell>
      <TableCell>
        <DataCell vendor={vendor} />
      </TableCell>
      <TableCell className="text-fg-muted">{vendor.owner?.name ?? t('noOwner')}</TableCell>
      <TableCell>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <ArchiveVendorButton vendor={vendor} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function VendorsTable({ vendors }: { vendors: VendorResponse[] }) {
  const t = useTranslations('vendors.columns');

  return (
    <Table aria-label={t('vendor')}>
      <Head />
      <TableBody>
        {vendors.map((vendor) => (
          <VendorRow key={vendor.id} vendor={vendor} />
        ))}
      </TableBody>
    </Table>
  );
}
