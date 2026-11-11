import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PeopleModule } from '../people/people.module';
import { ProfileModule } from '../profile/profile.module';
import { RequestsController } from './controllers/requests.controller';
import { RequestRepository } from './repositories/request.repository';
import { OpenRequestReader } from './services/open-request-reader';
import { RequestsService } from './services/requests.service';

@Module({
  imports: [ActivityModule, PeopleModule, ProfileModule],
  controllers: [RequestsController],
  providers: [RequestRepository, RequestsService, OpenRequestReader],
  exports: [OpenRequestReader],
})
export class RequestsModule {}
