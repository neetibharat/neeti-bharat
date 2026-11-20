import { Injectable } from '@nestjs/common';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Evidence, EvidenceKind } from '../../generated/prisma/client';

export interface NewEvidence {
  controlId: string;
  proofRequirementId: string | null;
  kind: EvidenceKind;
  title: string;
  url: string | null;
  note: string | null;
  /** For a file: where it is kept, and what it is. */
  file?: { key: string; name: string; size: number; type: string; sha256: string };
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

  /** The newest proof of this requirement that was added by this adder under this title. */
  latestBy(requirementId: string, addedById: string, title: string): Promise<Evidence | null> {
    return this.prisma.db.evidence.findFirst({
      where: { proofRequirementId: requirementId, addedById, title },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string, controlId: string): Promise<Evidence | null> {
    return this.prisma.db.evidence.findFirst({ where: { id, controlId } });
  }

  create({ file, ...data }: NewEvidence): Promise<Evidence> {
    const fileColumns = file && {
      fileKey: file.key,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileSha256: file.sha256,
    };
    return this.prisma.db.evidence.create({ data: { ...data, ...fileColumns, ...orgOwned() } });
  }

  delete(id: string): Promise<Evidence> {
    return this.prisma.db.evidence.delete({ where: { id } });
  }
}
