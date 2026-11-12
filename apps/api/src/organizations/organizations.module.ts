import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { OrganizationsController } from './controllers/organizations.controller';
import { MembershipRepository } from './repositories/membership.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { OrganizationGuard } from './services/organization.guard';
import { OrganizationsService } from './services/organizations.service';

@Module({
  imports: [ActivityModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    MembershipRepository,
    OrganizationRepository,
    OrganizationGuard,
  ],
  exports: [MembershipRepository, OrganizationRepository, OrganizationsService, OrganizationGuard],
})
export class OrganizationsModule {}
