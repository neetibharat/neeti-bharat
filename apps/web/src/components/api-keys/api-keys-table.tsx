'use client';

import type { ApiKeySummary } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { keyState, type ApiKeyState } from '@/lib/api-keys';
import { RevokeKeyButton } from './revoke-key-button';

const STATE_COLOR = { active: 'success', expired: 'warning', revoked: 'gray' } as const;

function When({ value, none }: { value: string | null; none: string }) {
  const format = useFormatter();
  if (!value) return <span className="text-fg-muted">{none}</span>;
  return <>{format.dateTime(new Date(value), { dateStyle: 'medium' })}</>;
}

function KeyRow({ apiKey }: { apiKey: ApiKeySummary }) {
  const t = useTranslations('apiKeys');
  const state: ApiKeyState = keyState(apiKey);

  return (
    <TableRow id={apiKey.id}>
      <TableCell>
        <div className="font-medium">{apiKey.name}</div>
        <div className="font-mono text-caption text-fg-muted">{apiKey.prefix}…</div>
      </TableCell>
      <TableCell>{t(`roles.${apiKey.role}`)}</TableCell>
      <TableCell className="text-fg-muted">
        {apiKey.createdByName}
        <div className="text-caption">
          <When value={apiKey.createdAt} none="" />
        </div>
      </TableCell>
      <TableCell className="text-fg-muted">
        <When value={apiKey.lastUsedAt} none={t('neverUsed')} />
      </TableCell>
      <TableCell className="text-fg-muted">
        <When value={apiKey.expiresAt} none={t('neverExpires')} />
      </TableCell>
      <TableCell>
        <Badge color={STATE_COLOR[state]}>{t(`status.${state}`)}</Badge>
      </TableCell>
      <TableCell>{state === 'revoked' ? null : <RevokeKeyButton apiKey={apiKey} />}</TableCell>
    </TableRow>
  );
}

export function ApiKeysTable({ keys }: { keys: ApiKeySummary[] }) {
  const t = useTranslations('apiKeys.columns');

  return (
    <Table aria-label={t('table')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('name')}</TableColumn>
        <TableColumn className="w-28">{t('access')}</TableColumn>
        <TableColumn className="w-48">{t('createdBy')}</TableColumn>
        <TableColumn className="w-36">{t('lastUsed')}</TableColumn>
        <TableColumn className="w-36">{t('expires')}</TableColumn>
        <TableColumn className="w-28">{t('status')}</TableColumn>
        <TableColumn className="w-16">{null}</TableColumn>
      </TableHeader>
      <TableBody>
        {keys.map((apiKey) => (
          <KeyRow key={apiKey.id} apiKey={apiKey} />
        ))}
      </TableBody>
    </Table>
  );
}
