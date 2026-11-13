import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { MailModule } from '../core/mail/mail.module';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { PreferenceRepository } from './repositories/preference.repository';
import { RecipientRepository } from './repositories/recipient.repository';
import { NoticeMailer } from './services/notice-mailer';
import { NotificationScanner } from './services/notification-scanner';
import { NotificationScheduler } from './services/notification-scheduler';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [ActivityModule, FrameworksModule, MailModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationScanner,
    NoticeMailer,
    NotificationScheduler,
    NotificationRepository,
    PreferenceRepository,
    RecipientRepository,
  ],
})
export class NotificationsModule {}
