'use client';

import { IconBellOff } from '@tabler/icons-react';
import type { NotificationListResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Pagination } from '@/components/base/pagination/pagination';
import { Loading } from '@/components/base/loading/loading';
import { Link } from '@/i18n/navigation';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/lib/api/notifications-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { NotificationRow } from './notification-row';

function HeaderActions({ unread }: { unread: number }) {
  const t = useTranslations('notifications');
  const [markAll, { isLoading }] = useMarkAllNotificationsReadMutation();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings/notifications"
        className="text-label font-medium text-brand hover:underline"
      >
        {t('settingsLink')}
      </Link>
      <Button
        color="secondary"
        isDisabled={unread === 0}
        isLoading={isLoading}
        onPress={() => void markAll()}
      >
        {t('markAll')}
      </Button>
    </div>
  );
}

/** The page of notices, and the way to the next. Opening one notes that it was read. */
function NoticeList({
  data,
  onPage,
}: {
  data: NotificationListResponse;
  onPage: (page: number) => void;
}) {
  const [markRead] = useMarkNotificationReadMutation();

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {data.items.map((notice) => (
          <NotificationRow
            key={notice.id}
            notice={notice}
            onOpen={() => void markRead(notice.id)}
          />
        ))}
      </ul>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={onPage}
      />
    </div>
  );
}

/** What is due soon or late in the person's own work, newest first. */
export function NotificationsPage() {
  const t = useTranslations('notifications');
  const errorMessage = useErrorMessage();
  const [page, setPage] = useState(1);
  const { data, error } = useGetNotificationsQuery(page);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<HeaderActions unread={data.unread} />}
      />
      {data.items.length === 0 ? (
        <Card variant="dashed">
          <EmptyState icon={IconBellOff} title={t('empty.title')} description={t('empty.body')} />
        </Card>
      ) : (
        <NoticeList data={data} onPage={setPage} />
      )}
    </>
  );
}
