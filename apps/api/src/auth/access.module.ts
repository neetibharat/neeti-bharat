import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PeopleModule } from '../people/people.module';
import { UsersModule } from '../users/users.module';
import { AccessPolicyService } from './services/access-policy.service';
import { InvitedMembersService } from './services/invited-members.service';

@Module({
  imports: [InvitationsModule, ActivityModule, OrganizationsModule, PeopleModule, UsersModule],
  providers: [AccessPolicyService, InvitedMembersService],
  exports: [AccessPolicyService],
})
export class AccessModule {}
