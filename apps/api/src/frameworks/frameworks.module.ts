import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { BreachesModule } from '../breaches/breaches.module';
import { StorageModule } from '../core/storage/storage.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RequestsModule } from '../requests/requests.module';
import { TrainingModule } from '../training/training.module';
import { VendorsModule } from '../vendors/vendors.module';
import { PeopleModule } from '../people/people.module';
import { ProfileModule } from '../profile/profile.module';
import { AssigneesController } from './controllers/assignees.controller';
import { ControlsController } from './controllers/controls.controller';
import { EvidenceController } from './controllers/evidence.controller';
import { FrameworksController } from './controllers/frameworks.controller';
import { PoliciesController } from './controllers/policies.controller';
import { PolicyAcceptanceController } from './controllers/policy-acceptance.controller';
import { MyWorkController } from './controllers/my-work.controller';
import { ProofController } from './controllers/proof.controller';
import { RequirementsController } from './controllers/requirements.controller';
import { ControlRepository } from './repositories/control.repository';
import { EvidenceRepository } from './repositories/evidence.repository';
import { FrameworkRepository } from './repositories/framework.repository';
import { FrameworkSeedRepository } from './repositories/framework-seed.repository';
import { PolicyAcceptanceRepository } from './repositories/policy-acceptance.repository';
import { PolicyRepository } from './repositories/policy.repository';
import { ProofRequirementRepository } from './repositories/proof-requirement.repository';
import { RequirementRepository } from './repositories/requirement.repository';
import { ControlEditService } from './services/control-edit.service';
import { EvidenceService } from './services/evidence.service';
import { FrameworkSeedService } from './services/framework-seed.service';
import { FrameworkEditService } from './services/framework-edit.service';
import { FrameworksService } from './services/frameworks.service';
import { MyWorkService } from './services/my-work.service';
import { OpenWorkReader } from './services/open-work-reader';
import { PoliciesService } from './services/policies.service';
import { PolicyAcceptanceService } from './services/policy-acceptance.service';
import { PolicyEditService } from './services/policy-edit.service';
import { RuleReader } from './services/rule-reader';
import { ProofService } from './services/proof.service';

@Module({
  imports: [
    ActivityModule,
    BreachesModule,
    VendorsModule,
    TrainingModule,
    OrganizationsModule,
    PeopleModule,
    ProfileModule,
    RequestsModule,
    StorageModule,
  ],
  controllers: [
    FrameworksController,
    AssigneesController,
    ControlsController,
    EvidenceController,
    ProofController,
    MyWorkController,
    RequirementsController,
    PoliciesController,
    PolicyAcceptanceController,
  ],
  providers: [
    FrameworksService,
    FrameworkEditService,
    RuleReader,
    ControlEditService,
    EvidenceService,
    ProofService,
    MyWorkService,
    OpenWorkReader,
    PoliciesService,
    PolicyEditService,
    PolicyAcceptanceService,
    PolicyAcceptanceRepository,
    FrameworkSeedService,
    ControlRepository,
    EvidenceRepository,
    ProofRequirementRepository,
    PolicyRepository,
    RequirementRepository,
    FrameworkRepository,
    FrameworkSeedRepository,
  ],
  exports: [FrameworksService, FrameworkSeedService, MyWorkService],
})
export class FrameworksModule {}
