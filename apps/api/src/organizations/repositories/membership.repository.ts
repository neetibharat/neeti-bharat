import { Injectable } from '@nestjs/common';
import type { AppRole } from '../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

/** A place someone can work in, and what they may do there. */
export interface OpenMembership {
  organizationId: string;
  organizationName: string;
  role: AppRole;
  onboarded: boolean;
}

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The organisations a person can open now, oldest first. */
  async findOpen(userId: string): Promise<OpenMembership[]> {
    const rows = await this.prisma.db.membership.findMany({
      where: { userId, disabledAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        organization: { select: { id: true, name: true, onboardedAt: true } },
      },
    });
    return rows.map((row) => ({
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      role: row.role,
      onboarded: row.organization.onboardedAt !== null,
    }));
  }

  /** Makes someone a member, or lets them back in with the role given if they had left. */
  async join(organizationId: string, userId: string, role: AppRole): Promise<void> {
    await this.prisma.db.membership.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: { organizationId, userId, role },
      update: { role, disabledAt: null },
    });
  }
}
