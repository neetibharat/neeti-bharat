import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { SecretsModule } from '../core/secrets/secrets.module';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ProfileModule } from '../profile/profile.module';
import { AiToolsController } from './controllers/ai-tools.controller';
import { AiController } from './controllers/ai.controller';
import { AiClient, HttpAiClient } from './providers/ai-client';
import { AiSettingRepository } from './repositories/ai-setting.repository';
import { AiRunner } from './services/ai-runner.service';
import { AiSettingsService } from './services/ai-settings.service';
import { PolicyCheckService } from './services/policy-check.service';
import { PolicyImportService } from './services/policy-import.service';
import { PolicyTailorService } from './services/policy-tailor.service';
import { ProofCheckService } from './services/proof-check.service';

@Module({
  imports: [ActivityModule, SecretsModule, ProfileModule, FrameworksModule, VendorsModule],
  controllers: [AiController, AiToolsController],
  providers: [
    AiSettingsService,
    AiRunner,
    PolicyImportService,
    PolicyTailorService,
    PolicyCheckService,
    ProofCheckService,
    AiSettingRepository,
    { provide: AiClient, useClass: HttpAiClient },
  ],
})
export class AiModule {}
