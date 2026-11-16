import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PeopleModule } from '../people/people.module';
import { ProfileModule } from '../profile/profile.module';
import { BreachesController } from './controllers/breaches.controller';
import { BreachRepository } from './repositories/breach.repository';
import { BreachesService } from './services/breaches.service';
import { OpenBreachReader } from './services/open-breach-reader';

@Module({
  imports: [ActivityModule, PeopleModule, ProfileModule],
  controllers: [BreachesController],
  providers: [BreachRepository, BreachesService, OpenBreachReader],
  exports: [OpenBreachReader],
})
export class BreachesModule {}
