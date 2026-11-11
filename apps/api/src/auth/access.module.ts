import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { PeopleModule } from '../people/people.module';
import { UsersModule } from '../users/users.module';
import { AccessPolicyService } from './services/access-policy.service';

@Module({
  imports: [InvitationsModule, ActivityModule, PeopleModule, UsersModule],
  providers: [AccessPolicyService],
  exports: [AccessPolicyService],
})
export class AccessModule {}
