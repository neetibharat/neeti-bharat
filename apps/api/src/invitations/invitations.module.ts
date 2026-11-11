import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { MailModule } from '../core/mail/mail.module';
import { UsersModule } from '../users/users.module';
import { InvitationRepository } from './repositories/invitation.repository';
import { InvitationService } from './services/invitation.service';

@Module({
  imports: [MailModule, ActivityModule, UsersModule],
  providers: [InvitationService, InvitationRepository],
  exports: [InvitationService],
})
export class InvitationsModule {}
