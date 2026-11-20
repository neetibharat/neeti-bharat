import { Injectable } from '@nestjs/common';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { CheckAcceptance } from '../../generated/prisma/client';

export interface NewAcceptance {
  connectionId: string;
  checkId: string;
  resourceName: string;
  reason: string;
  acceptedByName: string;
}

@Injectable()
export class CheckAcceptanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  forConnection(connectionId: string): Promise<CheckAcceptance[]> {
    return this.prisma.db.checkAcceptance.findMany({
      where: { connectionId },
      orderBy: [{ acceptedAt: 'desc' }, { id: 'desc' }],
    });
  }

  /** Saves the decision, or replaces the reason of one already made for the same check and resource. */
  upsert(data: NewAcceptance): Promise<CheckAcceptance> {
    const { connectionId, checkId, resourceName, ...rest } = data;
    return this.prisma.db.checkAcceptance.upsert({
      where: { connectionId_checkId_resourceName: { connectionId, checkId, resourceName } },
      create: { ...data, ...orgOwned() },
      update: { ...rest, acceptedAt: new Date() },
    });
  }

  findOne(id: string): Promise<CheckAcceptance | null> {
    return this.prisma.db.checkAcceptance.findFirst({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.db.checkAcceptance.deleteMany({ where: { id } });
  }
}
