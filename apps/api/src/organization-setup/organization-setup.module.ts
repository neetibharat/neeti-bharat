import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PeopleModule } from '../people/people.module';
import { OrganizationSetupController } from './controllers/organization-setup.controller';
import { OrganizationSetupService } from './services/organization-setup.service';

@Module({
  imports: [ActivityModule, FrameworksModule, OrganizationsModule, PeopleModule],
  controllers: [OrganizationSetupController],
  providers: [OrganizationSetupService],
})
export class OrganizationSetupModule {}
