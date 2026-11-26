'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import { requestRef, type RequestResponse } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetRequestQuery } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { EditRequestButton } from './edit-request-button';
import { RequestDetailsCard } from './request-details-card';
import { RequestDueCard } from './request-due-card';
import { RequestIdentityCard } from './request-identity-card';
import { RequestReplyCard } from './request-reply-card';
import { RequestTasksCard } from './request-tasks-card';
import { RequestTypeBadge } from './request-type-badge';

function BackLink() {
  const t = useTranslations('requests');
  return (
    <Link
      href="/requests"
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

/** One request on its own page: the identity check, the tasks, the reply, and the time left. */
export function RequestPage({ requestId }: { requestId: string }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetRequestQuery(requestId);

  if (error) {
    return (
      <>
        <BackLink />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;

  return (
    <>
      <BackLink />
      <Body request={data} />
    </>
  );
}

/** Tells a closed request apart: it is read-only and its reply is on record. */
function ClosedNotice({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.detail');
  const format = useFormatter();
  if (!request.closedAt) return null;
  const date = format.dateTime(new Date(request.closedAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Alert tone="success" title={t('closedTitle')}>
      {t('closedText', { date, name: request.closedByName ?? '' })}
    </Alert>
  );
}

function Labels({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.statuses');

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-label font-semibold text-fg-muted tabular-nums">
        {requestRef(request.number)}
      </span>
      <RequestTypeBadge type={request.type} />
      <Badge color={request.status === 'done' ? 'success' : 'gray'}>{t(request.status)}</Badge>
    </div>
  );
}

function Body({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.detail');
  const { canEdit } = useCan();
  const isOpen = request.closedAt === null;

  return (
    <>
      <Labels request={request} />
      <PageHeader
        title={request.personName}
        description={t('loggedBy', { name: request.loggedByName })}
        actions={canEdit && isOpen ? <EditRequestButton request={request} /> : undefined}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <div className="flex flex-col gap-5">
          <ClosedNotice request={request} />
          <RequestDetailsCard request={request} />
          <RequestIdentityCard request={request} />
          <RequestTasksCard request={request} />
          <RequestReplyCard request={request} />
        </div>
        <RequestDueCard request={request} />
      </div>
    </>
  );
}
