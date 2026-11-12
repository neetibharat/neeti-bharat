import { Injectable } from '@nestjs/common';
import type { Organization } from '../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Makes the organisation and its first admin together, or neither. */
  createWithAdmin(name: string, adminUserId: string): Promise<Organization> {
    return this.prisma.db.organization.create({
      data: { name, memberships: { create: { userId: adminUserId, role: 'admin' } } },
    });
  }

  async rename(id: string, name: string): Promise<void> {
    await this.prisma.db.organization.update({ where: { id }, data: { name } });
  }

  /** Notes that set-up is over. Doing it again keeps the first time and says it changed nothing. */
  async markOnboarded(id: string, now: Date): Promise<boolean> {
    const result = await this.prisma.db.organization.updateMany({
      where: { id, onboardedAt: null },
      data: { onboardedAt: now },
    });
    return result.count > 0;
  }

  /** Every organisation, for jobs that set each one up. */
  async allIds(): Promise<string[]> {
    const rows = await this.prisma.db.organization.findMany({ select: { id: true } });
    return rows.map((row) => row.id);
  }

  /**
   * The next REQ number of an organisation. The row stays locked until the request ends, so two requests logged at
   * the same moment never get the same number.
   */
  async nextRequestNumber(organizationId: string): Promise<number> {
    const row = await this.prisma.db.organization.update({
      where: { id: organizationId },
      data: { requestCounter: { increment: 1 } },
      select: { requestCounter: true },
    });
    return row.requestCounter;
  }
}
