import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

@Module({
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UsersModule {}
