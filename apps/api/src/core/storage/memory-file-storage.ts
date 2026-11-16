import { Injectable } from '@nestjs/common';
import { FileStorage, type DownloadOptions, type PutOptions } from './file-storage';

/** Keeps files in memory. For tests only: it stands in for a real provider behind the same abstraction. */
@Injectable()
export class MemoryFileStorage extends FileStorage {
  readonly objects = new Map<string, { body: Buffer; options: PutOptions }>();
  /** Name a method to make it fail, to test what happens then. */
  failOn: 'put' | 'read' | 'remove' | 'signedDownloadUrl' | null = null;

  isEnabled(): boolean {
    return true;
  }

  put(key: string, body: Buffer, options: PutOptions): Promise<void> {
    if (this.failOn === 'put') return Promise.reject(new Error('put failed'));
    this.objects.set(key, { body, options });
    return Promise.resolve();
  }

  read(key: string): Promise<Buffer> {
    if (this.failOn === 'read') return Promise.reject(new Error('read failed'));
    const object = this.objects.get(key);
    return object ? Promise.resolve(object.body) : Promise.reject(new Error('missing'));
  }

  signedDownloadUrl(key: string, options: DownloadOptions): Promise<string> {
    if (this.failOn === 'signedDownloadUrl') return Promise.reject(new Error('sign failed'));
    return Promise.resolve(`https://files.test/${key}?expires=${options.expiresInSeconds}`);
  }

  remove(key: string): Promise<void> {
    if (this.failOn === 'remove') return Promise.reject(new Error('remove failed'));
    this.objects.delete(key);
    return Promise.resolve();
  }
}
