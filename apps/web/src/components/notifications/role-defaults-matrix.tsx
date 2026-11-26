'use client';

import {
  APP_ROLES,
  type AppRole,
  NOTIFICATION_KINDS,
  type NotificationRoleDefault,
  type NotificationRoleDefaultsResponse,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { useUpdateNotificationRoleDefaultsMutation } from '@/lib/api/notifications-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

type Channel = 'inApp' | 'email';
const CHANNELS: Channel[] = ['inApp', 'email'];

/** One setting is a role, a kind and a way of being told. */
const keyOf = (role: string, kind: string, channel: Channel): string =>
  `${role}:${kind}:${channel}`;

function draftOf(data: NotificationRoleDefaultsResponse): Record<string, boolean> {
  const draft: Record<string, boolean> = {};
  for (const item of data.items) {
    for (const channel of CHANNELS) draft[keyOf(item.role, item.kind, channel)] = item[channel];
  }
  return draft;
}

/** The settings that differ from what is saved, in the shape the API takes. */
function changesOf(
  data: NotificationRoleDefaultsResponse,
  draft: Record<string, boolean>,
): NotificationRoleDefault[] {
  return data.items
    .map((item) => ({
      ...item,
      inApp: draft[keyOf(item.role, item.kind, 'inApp')] ?? item.inApp,
      email: draft[keyOf(item.role, item.kind, 'email')] ?? item.email,
    }))
    .filter(
      (item, index) =>
        item.inApp !== data.items[index]!.inApp || item.email !== data.items[index]!.email,
    );
}

type Draft = Record<string, boolean>;

interface MatrixProps {
  draft: Draft;
  onChange: (key: string, on: boolean) => void;
}

/** One role and one way of being told, with a box for each kind. The role is named on the first of its two rows. */
function MatrixRow({
  role,
  channel,
  draft,
  onChange,
}: MatrixProps & { role: AppRole; channel: Channel }) {
  const t = useTranslations('notifications.roleDefaults');
  const kinds = useTranslations('notifications.settings.kinds') as unknown as (
    key: string,
  ) => string;
  const roles = useTranslations('roles');

  return (
    <TableRow id={`${role}-${channel}`}>
      <TableCell>
        <span className="font-medium text-fg">{channel === 'inApp' ? roles(role) : ''}</span>
        <span className="block text-label text-fg-muted">{t(channel)}</span>
      </TableCell>
      {NOTIFICATION_KINDS.map((kind) => (
        <TableCell key={kind}>
          <Checkbox
            aria-label={`${roles(role)}, ${kinds(`${kind}.name`)}, ${t(channel)}`}
            isSelected={draft[keyOf(role, kind, channel)] ?? true}
            onChange={(on) => onChange(keyOf(role, kind, channel), on)}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

/** A row for each role and way of being told, a column for each kind. */
function MatrixTable(props: MatrixProps) {
  const t = useTranslations('notifications.roleDefaults');
  const kinds = useTranslations('notifications.settings.kinds') as unknown as (
    key: string,
  ) => string;

  return (
    <Table aria-label={t('title')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('role')}</TableColumn>
        {NOTIFICATION_KINDS.map((kind) => (
          <TableColumn key={kind}>{kinds(`${kind}.name`)}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {APP_ROLES.flatMap((role) =>
          CHANNELS.map((channel) => (
            <MatrixRow key={`${role}-${channel}`} role={role} channel={channel} {...props} />
          )),
        )}
      </TableBody>
    </Table>
  );
}

/** What each role gets by default, changed together and saved with one button. */
export function RoleDefaultsMatrix({ data }: { data: NotificationRoleDefaultsResponse }) {
  const t = useTranslations('notifications.roleDefaults');
  const errorMessage = useErrorMessage();
  const [draft, setDraft] = useState<Draft>(() => draftOf(data));
  const [save, { isLoading, error }] = useUpdateNotificationRoleDefaultsMutation();
  const changes = changesOf(data, draft);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-prose text-body text-fg-muted">{t('about')}</p>
        <Button
          isDisabled={changes.length === 0}
          isLoading={isLoading}
          onPress={() => void save({ items: changes })}
        >
          {t('save')}
        </Button>
      </div>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      <MatrixTable draft={draft} onChange={(key, on) => setDraft({ ...draft, [key]: on })} />
    </div>
  );
}
