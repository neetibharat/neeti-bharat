import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PeopleModule } from '../people/people.module';
import { TrainingController } from './controllers/training.controller';
import { TrainingRepository } from './repositories/training.repository';
import { TrainingService } from './services/training.service';
import { TrainingWorkReader } from './services/training-work-reader';

@Module({
  imports: [ActivityModule, PeopleModule],
  controllers: [TrainingController],
  providers: [TrainingRepository, TrainingService, TrainingWorkReader],
  exports: [TrainingWorkReader],
})
export class TrainingModule {}
