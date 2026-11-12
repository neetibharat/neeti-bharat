import { Injectable } from '@nestjs/common';
import type { PolicyDocument } from '@dpdp-kit/shared';
import { orgKey, orgOwned } from '../../core/org/keys';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Policy, PolicyApproval, PolicyStatus } from '../../generated/prisma/client';

export interface ApproverPerson {
  id: string;
  name: string;
  email: string;
}

/** A policy with how many controls it covers, how many versions it has had, and who must approve it. */
export type PolicyWithCount = Policy & {
  approver: ApproverPerson | null;
  _count: { controls: number; approvals: number };
};

/** A policy with the controls it covers (in catalogue order) and its approvals (newest first). */
export type PolicyWithDetail = PolicyWithCount & {
  controls: {
    control: { id: string; title: string; description: string; archivedAt: Date | null };
  }[];
  approvals: Omit<PolicyApproval, 'content'>[];
};

const SUMMARY = {
  approver: { select: { id: true, name: true, email: true } },
  _count: { select: { controls: true, approvals: true } },
} as const;

@Injectable()
export class PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Policies that have not been archived, in catalogue order. */
  findActive(): Promise<PolicyWithCount[]> {
    return this.prisma.db.policy.findMany({
      where: { archivedAt: null },
      include: SUMMARY,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOne(id: string): Promise<PolicyWithDetail | null> {
    return this.prisma.db.policy.findUnique({
      where: orgKey(id),
      include: {
        ...SUMMARY,
        controls: {
          select: {
            control: { select: { id: true, title: true, description: true, archivedAt: true } },
          },
          orderBy: { control: { sortOrder: 'asc' } },
        },
        approvals: { orderBy: { version: 'desc' }, omit: { content: true } },
      },
    });
  }

  findVersion(id: string, version: number): Promise<PolicyApproval | null> {
    return this.prisma.db.policyApproval.findUnique({
      where: {
        organizationId_policyId_version: {
          organizationId: currentOrganizationId(),
          policyId: id,
          version,
        },
      },
    });
  }

  saveContent(id: string, content: PolicyDocument, editedByName: string): Promise<Policy> {
    return this.prisma.db.policy.update({
      where: orgKey(id),
      data: {
        content: content as object,
        contentEditedAt: new Date(),
        contentEditedByName: editedByName,
      },
    });
  }

  setApprover(id: string, approverId: string | null): Promise<Policy> {
    return this.prisma.db.policy.update({ where: orgKey(id), data: { approverId } });
  }

  /**
   * Moves a policy from one status to another that is not "approved". Any earlier approval stops standing.
   * Returns false when someone else already moved it, so the caller can say so.
   */
  async setStatus(
    id: string,
    from: PolicyStatus,
    to: PolicyStatus,
    changelog: string | null,
  ): Promise<boolean> {
    const moved = await this.prisma.db.policy.updateMany({
      where: { id, status: from },
      data: { status: to, changelog, approvedAt: null, approvedByName: null },
    });
    return moved.count === 1;
  }

  /**
   * Approves a policy and keeps the text it approved as the next version, together or not at all.
   * Returns null when the policy is no longer in the status the caller saw.
   */
  async approve(
    id: string,
    from: PolicyStatus,
    approver: { id: string; name: string },
    content: PolicyDocument,
    changelog: string | null,
  ): Promise<number | null> {
    return this.prisma.transact(async (tx) => {
      // Two approvals of one policy take turns, so each gets its own version number.
      await tx.$queryRaw`SELECT id FROM policies WHERE id = ${id} AND "organizationId" = ${currentOrganizationId()} FOR UPDATE`;
      const current = await tx.policy.findUnique({ where: orgKey(id), select: { status: true } });
      if (current?.status !== from) return null;
      const last = await tx.policyApproval.aggregate({
        where: { policyId: id },
        _max: { version: true },
      });
      const version = (last._max.version ?? 0) + 1;
      const approvedAt = new Date();
      await tx.policy.update({
        where: orgKey(id),
        data: { status: 'approved', approvedAt, approvedByName: approver.name, changelog: null },
      });
      await tx.policyApproval.create({
        data: {
          ...orgOwned(),
          policyId: id,
          approvedAt,
          approvedById: approver.id,
          approvedByName: approver.name,
          version,
          content: content as object,
          changelog,
        },
      });
      return version;
    });
  }
}
