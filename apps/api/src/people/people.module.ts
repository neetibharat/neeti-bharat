import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { UsersModule } from '../users/users.module';
import { AccessChangeService } from './services/access-change.service';
import { PeopleController } from './controllers/people.controller';
import { PeopleRepository } from './repositories/people.repository';
import { PeopleService } from './services/people.service';
import { PersonDirectory } from './services/person-directory';
import { RoleHolderReader } from './services/role-holder-reader';
import { RoleService } from './services/role.service';
import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [InvitationsModule, ActivityModule, UsersModule],
  controllers: [PeopleController, RolesController],
  providers: [
    PeopleRepository,
    PeopleService,
    AccessChangeService,
    RoleService,
    RoleHolderReader,
    PersonDirectory,
  ],
  exports: [PeopleService, RoleHolderReader, PersonDirectory],
})
export class PeopleModule {}
