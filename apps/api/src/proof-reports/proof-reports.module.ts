import { Module } from '@nestjs/common';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { TrainingModule } from '../training/training.module';
import { ReportSourceRepository } from './repositories/report-source.repository';
import { ProofReportScheduler } from './services/proof-report-scheduler';
import { ProofReportService } from './services/proof-report.service';

@Module({
  imports: [FrameworksModule, TrainingModule],
  providers: [ReportSourceRepository, ProofReportService, ProofReportScheduler],
  exports: [ProofReportService],
})
export class ProofReportsModule {}
