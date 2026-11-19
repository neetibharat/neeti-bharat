import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { PolicyAcceptance } from '../../generated/prisma/client';

/** The little of an approved policy that acceptance needs. */
export interface ApprovedPolicy {
  id: string;
  title: string;
  summary: string;
  approvedAt: Date;
}

@Injectable()
export class PolicyAcceptanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The policies that are approved and not archived, in catalogue order. */
  async approved(): Promise<ApprovedPolicy[]> {
    const rows = await this.prisma.db.policy.findMany({
      where: { status: 'approved', archivedAt: null, approvedAt: { not: null } },
      select: { id: true, title: true, summary: true, approvedAt: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({ ...row, approvedAt: row.approvedAt! }));
  }

  findApproved(id: string): Promise<ApprovedPolicy | null> {
    return this.approved().then((all) => all.find((policy) => policy.id === id) ?? null);
  }

  /** What these people have accepted. */
  ofPeople(personIds: string[]): Promise<PolicyAcceptance[]> {
    return this.prisma.db.policyAcceptance.findMany({ where: { personId: { in: personIds } } });
  }

  /** Accepting again moves the date. */
  accept(policyId: string, personId: string, at: Date): Promise<PolicyAcceptance> {
    return this.prisma.db.policyAcceptance.upsert({
      where: { policyId_personId: { policyId, personId } },
      create: { policyId, personId, acceptedAt: at, organizationId: currentOrganizationId() },
      update: { acceptedAt: at },
    });
  }
}
