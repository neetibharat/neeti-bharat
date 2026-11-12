import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ReadinessController } from './controllers/readiness.controller';
import { ReadinessRepository } from './repositories/readiness.repository';
import { ReadinessService } from './services/readiness.service';

@Module({
  imports: [ActivityModule],
  controllers: [ReadinessController],
  providers: [ReadinessService, ReadinessRepository],
})
export class ReadinessModule {}
