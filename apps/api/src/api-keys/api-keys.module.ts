import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { ApiKeyAdmission } from './services/api-key-admission';
import { ApiKeysService } from './services/api-keys.service';

@Module({
  imports: [ActivityModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyRepository, ApiKeyAdmission],
  exports: [ApiKeyAdmission],
})
export class ApiKeysModule {}
