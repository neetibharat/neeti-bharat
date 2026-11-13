'use client';

import { NOTIFICATION_KINDS, type NotificationPreference } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { PageHeader } from '@/components/base/page-header/page-header';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import {
  useGetNotificationPreferencesQuery,
  useGetNotificationRoleDefaultsQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/lib/api/notifications-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RoleDefaultsMatrix } from './role-defaults-matrix';

/** One kind of notice, and a box for each way of hearing about it. */
function PreferenceRow({
  preference,
  onChange,
}: {
  preference: NotificationPreference;
  onChange: (next: NotificationPreference) => void;
}) {
  const t = useTranslations('notifications.settings');
  const words = t as unknown as (key: string) => string;
  const name = words(`kinds.${preference.kind}.name`);

  return (
    <TableRow id={preference.kind}>
      <TableCell>
        <p className="font-medium text-fg">{name}</p>
        <p className="text-label text-fg-muted">{words(`kinds.${preference.kind}.about`)}</p>
      </TableCell>
      {(['inApp', 'email'] as const).map((channel) => (
        <TableCell key={channel}>
          <div className="flex justify-center">
            <Checkbox
              aria-label={`${name}, ${t(channel)}`}
              isSelected={preference[channel]}
              onChange={(on) => onChange({ ...preference, [channel]: on })}
            />
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}

/** How the signed-in person hears about each kind of notice. Each change is saved as it is made. */
function MyNotifications() {
  const t = useTranslations('notifications.settings');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetNotificationPreferencesQuery();
  const [save, { error: saveError }] = useUpdateNotificationPreferencesMutation();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;
  const order = (kind: NotificationPreference['kind']) => NOTIFICATION_KINDS.indexOf(kind);

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-prose text-body text-fg-muted">{t('note')}</p>
      {saveError && <Alert tone="error">{errorMessage(saveError)}</Alert>}
      <Table aria-label={t('title')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('kind')}</TableColumn>
          <TableColumn className="w-40 text-center">{t('inApp')}</TableColumn>
          <TableColumn className="w-40 text-center">{t('email')}</TableColumn>
        </TableHeader>
        <TableBody>
          {[...data.items]
            .sort((a, b) => order(a.kind) - order(b.kind))
            .map((preference) => (
              <PreferenceRow
                key={preference.kind}
                preference={preference}
                onChange={(next) => void save({ items: [next] })}
              />
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** What each role gets by default. Admins only. */
function RoleDefaults() {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetNotificationRoleDefaultsQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  return <RoleDefaultsMatrix data={data} />;
}

/** The person's own choices, and for an admin a second tab with what each role gets by default. */
export function PreferencesPage() {
  const t = useTranslations('notifications.settings');
  const { isAdmin } = useCan();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      {isAdmin ? (
        <Tabs
          tabs={[
            { id: 'mine', label: t('tabs.mine'), content: <MyNotifications /> },
            { id: 'roles', label: t('tabs.roles'), content: <RoleDefaults /> },
          ]}
        />
      ) : (
        <MyNotifications />
      )}
    </>
  );
}
