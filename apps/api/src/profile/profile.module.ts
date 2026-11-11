import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PeopleModule } from '../people/people.module';
import { ProfileController } from './controllers/profile.controller';
import { ProfileRepository } from './repositories/profile.repository';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [ActivityModule, PeopleModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService],
})
export class ProfileModule {}
