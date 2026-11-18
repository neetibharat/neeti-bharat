import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { SecretsModule } from '../core/secrets/secrets.module';
import { ProfileModule } from '../profile/profile.module';
import { AiController } from './controllers/ai.controller';
import { AiClient, HttpAiClient } from './providers/ai-client';
import { AiSettingRepository } from './repositories/ai-setting.repository';
import { AiSettingsService } from './services/ai-settings.service';
import { PolicyImportService } from './services/policy-import.service';

@Module({
  imports: [ActivityModule, SecretsModule, ProfileModule],
  controllers: [AiController],
  providers: [
    AiSettingsService,
    PolicyImportService,
    AiSettingRepository,
    { provide: AiClient, useClass: HttpAiClient },
  ],
})
export class AiModule {}
