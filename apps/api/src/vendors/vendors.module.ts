import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PeopleModule } from '../people/people.module';
import { VendorsController } from './controllers/vendors.controller';
import { VendorRepository } from './repositories/vendor.repository';
import { VendorBriefReader } from './services/vendor-brief-reader';
import { VendorWorkReader } from './services/vendor-work-reader';
import { VendorsService } from './services/vendors.service';

@Module({
  imports: [ActivityModule, PeopleModule],
  controllers: [VendorsController],
  providers: [VendorRepository, VendorsService, VendorWorkReader, VendorBriefReader],
  exports: [VendorWorkReader, VendorBriefReader],
})
export class VendorsModule {}
