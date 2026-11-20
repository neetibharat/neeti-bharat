import { Injectable } from '@nestjs/common';
import type { ProofFrequency } from '@dpdp-kit/shared';
import { orgKey, orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Evidence, Prisma, ProofRequirement } from '../../generated/prisma/client';
import { nextSortOrder } from '../utils/sort-order';

/** A requirement with the proof given for it, newest first. */
export type RequirementWithEvidence = ProofRequirement & {
  evidence: Evidence[];
  assignee: { id: string; name: string } | null;
};

export interface RequirementDetails {
  title: string;
  description: string;
  frequency: ProofFrequency;
  assigneeId: string | null;
  dueDate: Date | null;
}

export interface NewRequirement extends RequirementDetails {
  id: string;
  controlId: string;
}

/** A requirement with the control it belongs to. */
export type RequirementWithControl = ProofRequirement & { control: { id: string; title: string } };

const WITH_EVIDENCE = {
  evidence: { orderBy: { createdAt: 'desc' } },
  assignee: { select: { id: true, name: true } },
} satisfies Prisma.ProofRequirementInclude;

@Injectable()
export class ProofRequirementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The requirements of a control that have not been archived, in order, each with its proof. */
  findByControl(controlId: string): Promise<RequirementWithEvidence[]> {
    return this.prisma.db.proofRequirement.findMany({
      where: { controlId, archivedAt: null },
      include: WITH_EVIDENCE,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** The requirement copied from this catalogue id, if it and its control have not been archived. */
  findCurrentByTemplate(templateId: string): Promise<RequirementWithControl | null> {
    return this.prisma.db.proofRequirement.findFirst({
      where: { templateId, archivedAt: null, control: { archivedAt: null } },
      include: { control: { select: { id: true, title: true } } },
    });
  }

  findWithEvidence(id: string): Promise<RequirementWithEvidence | null> {
    return this.prisma.db.proofRequirement.findUnique({
      where: orgKey(id),
      include: WITH_EVIDENCE,
    });
  }

  /** The archived requirements of a control, most recently added last. */
  findArchivedByControl(controlId: string): Promise<ProofRequirement[]> {
    return this.prisma.db.proofRequirement.findMany({
      where: { controlId, archivedAt: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOne(id: string): Promise<ProofRequirement | null> {
    return this.prisma.db.proofRequirement.findUnique({ where: orgKey(id) });
  }

  /** Adds a requirement at the end of its control's list. */
  async create(data: NewRequirement): Promise<ProofRequirement> {
    const sortOrder = await nextSortOrder(() =>
      this.prisma.db.proofRequirement.aggregate({
        where: { controlId: data.controlId },
        _max: { sortOrder: true },
      }),
    );
    return this.prisma.db.proofRequirement.create({
      data: { ...data, ...orgOwned(), sortOrder },
    });
  }

  update(id: string, data: RequirementDetails): Promise<ProofRequirement> {
    return this.prisma.db.proofRequirement.update({ where: orgKey(id), data });
  }

  restore(id: string): Promise<ProofRequirement> {
    return this.prisma.db.proofRequirement.update({
      where: orgKey(id),
      data: { archivedAt: null },
    });
  }

  /** Archives a requirement. Its proof stays on the control as general proof until it is restored. */
  archive(id: string): Promise<ProofRequirement> {
    return this.prisma.db.proofRequirement.update({
      where: orgKey(id),
      data: { archivedAt: new Date() },
    });
  }
}
