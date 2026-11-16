import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageController } from './controllers/storage.controller';
import { createFileStorage } from './create-file-storage';
import { FileStorage } from './file-storage';
import { StorageService } from './services/storage.service';

@Module({
  controllers: [StorageController],
  providers: [
    { provide: FileStorage, inject: [ConfigService], useFactory: createFileStorage },
    StorageService,
  ],
  exports: [FileStorage],
})
export class StorageModule {}
