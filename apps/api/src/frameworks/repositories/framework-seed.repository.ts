import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { CatalogueRows, ExistingIds } from '../utils/catalogue-rows';

@Injectable()
export class FrameworkSeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existingIds(): Promise<ExistingIds> {
    const [frameworks, requirements, controls, policies, proof] = await Promise.all([
      this.prisma.db.framework.findMany({ select: { id: true } }),
      this.prisma.db.requirement.findMany({ select: { id: true } }),
      this.prisma.db.control.findMany({ select: { id: true } }),
      this.prisma.db.policy.findMany({ select: { id: true } }),
      this.prisma.db.proofRequirement.findMany({ select: { id: true } }),
    ]);
    return {
      frameworkIds: new Set(frameworks.map((row) => row.id)),
      requirementIds: new Set(requirements.map((row) => row.id)),
      controlIds: new Set(controls.map((row) => row.id)),
      policyIds: new Set(policies.map((row) => row.id)),
      proofIds: new Set(proof.map((row) => row.id)),
    };
  }

  /** Stores new rows and their links together, or none of them. */
  async insert(rows: CatalogueRows): Promise<void> {
    await this.prisma.transact(async (db) => {
      await db.framework.createMany({ data: rows.frameworks, skipDuplicates: true });
      await db.requirement.createMany({ data: rows.requirements, skipDuplicates: true });
      await db.policy.createMany({ data: rows.policies, skipDuplicates: true });
      await db.control.createMany({ data: rows.controls, skipDuplicates: true });
      await db.controlPolicyLink.createMany({ data: rows.links, skipDuplicates: true });
      await db.proofRequirement.createMany({ data: rows.proofRequirements, skipDuplicates: true });
    });
  }
}
