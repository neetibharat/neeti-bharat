import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProfileModule } from '../profile/profile.module';
import { WebsiteChecksController } from './controllers/website-checks.controller';
import { WebsiteCheckRepository } from './repositories/website-check.repository';
import { SiteReader } from './services/site-reader';
import { WebsiteChecksService } from './services/website-checks.service';

@Module({
  imports: [ActivityModule, ProfileModule],
  controllers: [WebsiteChecksController],
  providers: [WebsiteChecksService, SiteReader, WebsiteCheckRepository],
})
export class WebsiteChecksModule {}
