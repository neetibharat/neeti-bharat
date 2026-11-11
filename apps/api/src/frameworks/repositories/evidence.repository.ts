import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Evidence, EvidenceKind } from '../../generated/prisma/client';

export interface NewEvidence {
  controlId: string;
  proofRequirementId: string | null;
  kind: EvidenceKind;
  title: string;
  url: string | null;
  note: string | null;
  addedById: string;
  addedByName: string;
}

@Injectable()
export class EvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** General proof: attached to the control, not to a requirement, or to one that has since been archived. Newest first. */
  findGeneral(controlId: string): Promise<Evidence[]> {
    return this.prisma.db.evidence.findMany({
      where: {
        controlId,
        OR: [{ proofRequirementId: null }, { proofRequirement: { archivedAt: { not: null } } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, controlId: string): Promise<Evidence | null> {
    return this.prisma.db.evidence.findFirst({ where: { id, controlId } });
  }

  create(data: NewEvidence): Promise<Evidence> {
    return this.prisma.db.evidence.create({ data });
  }

  delete(id: string): Promise<Evidence> {
    return this.prisma.db.evidence.delete({ where: { id } });
  }
}
