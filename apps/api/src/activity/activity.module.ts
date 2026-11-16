import { Module } from '@nestjs/common';
import { ActivityController } from './controllers/activity.controller';
import { ActivityRepository } from './repositories/activity.repository';
import { ActivityService } from './services/activity.service';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository],
  exports: [ActivityService],
})
export class ActivityModule {}
