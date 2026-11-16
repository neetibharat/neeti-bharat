import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../common/app.exception';
import { FileStorage } from './file-storage';

/** Stands in when no bucket is configured, so uploads fail with a clear code instead of at random. */
@Injectable()
export class DisabledFileStorage extends FileStorage {
  isEnabled(): boolean {
    return false;
  }

  put(): Promise<void> {
    return this.refuse();
  }

  read(): Promise<Buffer> {
    return this.refuse();
  }

  signedDownloadUrl(): Promise<string> {
    return this.refuse();
  }

  remove(): Promise<void> {
    return this.refuse();
  }

  private refuse(): Promise<never> {
    return Promise.reject(
      new AppException('STORAGE_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE),
    );
  }
}
