import { Injectable } from '@nestjs/common';
import type { AppRole, NotificationKind } from '../../generated/prisma/enums';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface PreferenceRow {
  userId: string;
  kind: NotificationKind;
  inApp: boolean;
  email: boolean;
}

export interface RoleDefaultRow {
  role: AppRole;
  kind: NotificationKind;
  inApp: boolean;
  email: boolean;
}

@Injectable()
export class PreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  forUsers(userIds: string[]): Promise<PreferenceRow[]> {
    return this.prisma.db.notificationPreference.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, kind: true, inApp: true, email: true },
    });
  }

  async save(userId: string, items: Omit<PreferenceRow, 'userId'>[]): Promise<void> {
    const organizationId = currentOrganizationId();
    for (const { kind, inApp, email } of items) {
      await this.prisma.db.notificationPreference.upsert({
        where: { organizationId_userId_kind: { organizationId, userId, kind } },
        create: { organizationId, userId, kind, inApp, email },
        update: { inApp, email },
      });
    }
  }

  roleDefaults(): Promise<RoleDefaultRow[]> {
    return this.prisma.db.notificationRoleDefault.findMany({
      select: { role: true, kind: true, inApp: true, email: true },
    });
  }

  async saveRoleDefaults(items: RoleDefaultRow[]): Promise<void> {
    const organizationId = currentOrganizationId();
    for (const { role, kind, inApp, email } of items) {
      await this.prisma.db.notificationRoleDefault.upsert({
        where: { organizationId_role_kind: { organizationId, role, kind } },
        create: { organizationId, role, kind, inApp, email },
        update: { inApp, email },
      });
    }
  }
}
