import { Injectable } from '@nestjs/common';
import { orgKey, orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { JobRole, ProofFrequency } from '@dpdp-kit/shared';
import type { Control, Prisma } from '../../generated/prisma/client';
import { nextSortOrder } from '../utils/sort-order';

/** A control with the policies that cover it (primary first) and the person it is assigned to. */
export type ControlWithLinks = Control & {
  policies: { policyId: string; position: number }[];
  assignee: { id: string; name: string } | null;
  _count: { evidence: number };
  /** The requirements that have not been archived, each with its newest proof. */
  proofRequirements: {
    id: string;
    title: string;
    frequency: ProofFrequency;
    dueDate: Date | null;
    assignee: { id: string; name: string } | null;
    evidence: { createdAt: Date }[];
  }[];
};

export interface ControlChange {
  /** A job code, or null to go back to the default owner. */
  ownerRole: JobRole | null;
}

export interface ControlDetails {
  /** Set only when the owner job changes. Null goes back to the default owner. */
  ownerRole?: JobRole | null;
  title: string;
  description: string;
  assigneeId: string | null;
  reviewDate: Date | null;
}

export interface NewControl extends ControlDetails {
  id: string;
  frameworkId: string;
  requirementId: string;
}

const WITH_LINKS = {
  policies: { select: { policyId: true, position: true }, orderBy: { position: 'asc' } },
  assignee: { select: { id: true, name: true } },
  _count: { select: { evidence: true } },
  proofRequirements: {
    where: { archivedAt: null },
    select: {
      id: true,
      title: true,
      frequency: true,
      dueDate: true,
      assignee: { select: { id: true, name: true } },
      evidence: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.ControlInclude;

const linksOf = (controlId: string, policyIds: string[]) =>
  policyIds.map((policyId, position) => ({ ...orgOwned(), controlId, policyId, position }));

@Injectable()
export class ControlRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Controls that have not been archived, in catalogue order. */
  findActive(): Promise<ControlWithLinks[]> {
    return this.prisma.db.control.findMany({
      where: { archivedAt: null },
      include: WITH_LINKS,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** How many controls that have not been archived sit under a rule. */
  countActiveInRequirement(requirementId: string): Promise<number> {
    return this.prisma.db.control.count({ where: { requirementId, archivedAt: null } });
  }

  /** How many controls that have not been archived sit under a framework. */
  countActiveInFramework(frameworkId: string): Promise<number> {
    return this.prisma.db.control.count({ where: { frameworkId, archivedAt: null } });
  }

  findArchived(): Promise<{ id: string; title: string; requirementId: string }[]> {
    return this.prisma.db.control.findMany({
      where: { archivedAt: { not: null } },
      select: { id: true, title: true, requirementId: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOne(id: string): Promise<ControlWithLinks | null> {
    return this.prisma.db.control.findUnique({ where: orgKey(id), include: WITH_LINKS });
  }

  update(id: string, change: ControlChange): Promise<Control> {
    return this.prisma.db.control.update({ where: orgKey(id), data: change });
  }

  /** The controls a policy covers. */
  async idsCoveredBy(policyId: string): Promise<Set<string>> {
    const links = await this.prisma.db.controlPolicyLink.findMany({
      where: { policyId },
      select: { controlId: true },
    });
    return new Set(links.map((link) => link.controlId));
  }

  /** Adds a control at the end of the list, with its policies in the order given. */
  async create(data: NewControl, policyIds: string[]): Promise<void> {
    const sortOrder = await nextSortOrder(() =>
      this.prisma.db.control.aggregate({ _max: { sortOrder: true } }),
    );
    await this.prisma.transact(async (db) => {
      await db.control.create({ data: { ...data, ...orgOwned(), sortOrder } });
      await db.controlPolicyLink.createMany({ data: linksOf(data.id, policyIds) });
    });
  }

  /** Saves a control's details and replaces the policies that cover it, together or not at all. */
  async saveDetails(id: string, details: ControlDetails, policyIds: string[]): Promise<void> {
    await this.prisma.transact(async (db) => {
      await db.control.update({ where: orgKey(id), data: details });
      await db.controlPolicyLink.deleteMany({ where: { controlId: id } });
      await db.controlPolicyLink.createMany({ data: linksOf(id, policyIds) });
    });
  }

  setArchived(id: string, archivedAt: Date | null): Promise<Control> {
    return this.prisma.db.control.update({ where: orgKey(id), data: { archivedAt } });
  }
}
