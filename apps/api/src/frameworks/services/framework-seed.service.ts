import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FrameworkSeedRepository } from '../repositories/framework-seed.repository';
import { dpdpRows, planSeed } from '../utils/catalogue-rows';

/** Copies the framework catalogue into the company's own tables, so the company can edit its copy. */
@Injectable()
export class FrameworkSeedService implements OnModuleInit {
  private readonly logger = new Logger(FrameworkSeedService.name);

  constructor(private readonly repository: FrameworkSeedRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  /** Safe to run on every start: anything already stored is left as the company has it. */
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
