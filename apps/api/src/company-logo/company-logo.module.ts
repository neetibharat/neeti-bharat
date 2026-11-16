import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { StorageModule } from '../core/storage/storage.module';
import { CompanyLogoController } from './controllers/company-logo.controller';
import { CompanyLogoRepository } from './repositories/company-logo.repository';
import { CompanyLogoService } from './services/company-logo.service';

@Module({
  imports: [ActivityModule, StorageModule],
  controllers: [CompanyLogoController],
  providers: [CompanyLogoService, CompanyLogoRepository],
})
export class CompanyLogoModule {}
