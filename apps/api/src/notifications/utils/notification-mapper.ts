import type { NotificationSummary } from '@dpdp-kit/shared';
import type { Notification } from '../../generated/prisma/client';

export function toNotificationSummary(row: Notification): NotificationSummary {
  return {
    id: row.id,
    kind: row.kind,
    state: row.state,
    subjectId: row.subjectId,
    title: row.title,
    dueOn: row.dueOn,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
