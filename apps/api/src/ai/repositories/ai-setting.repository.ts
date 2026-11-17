import { Injectable } from '@nestjs/common';
import type { AiSetting } from '../../generated/prisma/client';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface AiSettingData {
  provider: string;
  model: string;
  /** Already sealed. */
  apiKey: string;
  keyHint: string;
  updatedByName: string;
}

@Injectable()
export class AiSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(): Promise<AiSetting | null> {
    return this.prisma.db.aiSetting.findUnique({
      where: { organizationId: currentOrganizationId() },
    });
  }

  /**
   * Sets the AI service, replacing the one there, and does whatever has to be saved with it, such as its log entry,
   * together or not at all. It opens the transaction itself, because the key is tried with the service first and a
   * transaction held open while that waits could expire.
   */
  saveWith(data: AiSettingData, alongside: () => Promise<void>): Promise<AiSetting> {
    return this.prisma.runInTransaction(async () => {
      const organizationId = currentOrganizationId();
      const row = await this.prisma.db.aiSetting.upsert({
        where: { organizationId },
        create: { organizationId, ...data },
        update: data,
      });
      await alongside();
      return row;
    });
  }

  async remove(): Promise<void> {
    await this.prisma.db.aiSetting.deleteMany({
      where: { organizationId: currentOrganizationId() },
    });
  }
}
