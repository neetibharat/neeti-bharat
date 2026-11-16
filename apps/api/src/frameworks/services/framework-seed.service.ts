import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { runInOrganization } from '../../core/org/org-context';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { FrameworkSeedRepository } from '../repositories/framework-seed.repository';
import { dpdpRows, planSeed } from '../utils/catalogue-rows';

/** Copies the framework catalogue into the company's own tables, so the company can edit its copy. */
@Injectable()
export class FrameworkSeedService implements OnModuleInit {
  private readonly logger = new Logger(FrameworkSeedService.name);

  constructor(
    private readonly repository: FrameworkSeedRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  /** Every organisation gets any catalogue rows it does not have yet, so a new release reaches all of them. */
  async onModuleInit(): Promise<void> {
    for (const organizationId of await this.organizations.allIds()) {
      await runInOrganization(organizationId, () => this.seed());
    }
  }

  /** For the organisation it is run in. Safe to run on every start: anything already stored is left as it is. */
  async seed(): Promise<void> {
    const plan = planSeed(dpdpRows(), await this.repository.existingIds());
    const nothingNew = [
      plan.frameworks,
      plan.requirements,
      plan.controls,
      plan.policies,
      plan.proofRequirements,
    ];
    if (nothingNew.every((rows) => rows.length === 0)) return;
    await this.repository.insert(plan);
    this.logger.log(
      `Added ${plan.requirements.length} rules, ${plan.controls.length} controls, ${plan.policies.length} policies and ${plan.proofRequirements.length} proof requirements`,
    );
  }
}
