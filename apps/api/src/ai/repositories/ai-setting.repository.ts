import { Injectable } from '@nestjs/common';
import type { AiSetting } from '../../generated/prisma/client';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AiSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(): Promise<AiSetting | null> {
    return this.prisma.db.aiSetting.findUnique({
      where: { organizationId: currentOrganizationId() },
    });
  }

  /** Runs `work` in one transaction, joining the request's when it has one. */
  inTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.transact(() => work());
  }

  /** Sets which features are on, and who did it. */
  setEnabledFeatures(enabledFeatures: string[], updatedByName: string): Promise<AiSetting> {
    const organizationId = currentOrganizationId();
    return this.prisma.db.aiSetting.upsert({
      where: { organizationId },
      create: { organizationId, enabledFeatures, updatedByName },
      update: { enabledFeatures, updatedByName },
    });
  }
}
