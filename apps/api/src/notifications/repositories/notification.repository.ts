import { Injectable } from '@nestjs/common';
import type { NotificationKind, NotificationState } from '../../generated/prisma/enums';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface NewNotification {
  userId: string;
  kind: NotificationKind;
  state: NotificationState;
  subjectId: string;
  title: string;
  dueOn: string;
  dedupeKey: string;
  readAt: Date | null;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of a person's notices, newest first. */
  async list(userId: string, page: number, limit: number, unreadOnly: boolean) {
    const where = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.db.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.notification.count({ where }),
    ]);
    return { rows, total };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.db.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string, at: Date): Promise<void> {
    await this.prisma.db.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: at },
    });
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.prisma.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: at },
    });
  }

  /** Which of these keys already have a notice for this person. */
  async existingKeys(userId: string, keys: string[]): Promise<Set<string>> {
    const rows = await this.prisma.db.notification.findMany({
      where: { userId, dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    });
    return new Set(rows.map((row) => row.dedupeKey));
  }

  /** Makes the notices and gives them back. One that already exists is left alone, so two checks at once make it once. */
  createMany(rows: NewNotification[]) {
    const organizationId = currentOrganizationId();
    return this.prisma.db.notification.createManyAndReturn({
      data: rows.map((row) => ({ ...row, organizationId })),
      skipDuplicates: true,
    });
  }

  async markEmailed(ids: string[], at: Date): Promise<void> {
    await this.prisma.db.notification.updateMany({
      where: { id: { in: ids } },
      data: { emailedAt: at },
    });
  }
}
