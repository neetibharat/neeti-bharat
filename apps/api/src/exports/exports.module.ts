import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { StorageModule } from '../core/storage/storage.module';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { ExportsController } from './controllers/exports.controller';
import { ExportRepository } from './repositories/export.repository';
import { AuditPackService } from './services/audit-pack.service';
import { ExportService } from './services/export.service';

@Module({
  imports: [ActivityModule, FrameworksModule, StorageModule],
  controllers: [ExportsController],
  providers: [ExportService, AuditPackService, ExportRepository],
})
export class ExportsModule {}
