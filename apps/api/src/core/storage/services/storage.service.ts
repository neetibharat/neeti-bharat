import { Injectable } from '@nestjs/common';
import {
  EVIDENCE_FILE_EXTENSIONS,
  EVIDENCE_FILE_MAX_BYTES,
  type StorageStatusResponse,
} from '@dpdp-kit/shared';
import { FileStorage } from '../file-storage';

@Injectable()
export class StorageService {
  constructor(private readonly storage: FileStorage) {}

  /** Whether files can be uploaded, and what is accepted, so the web app knows what to offer. */
  status(): StorageStatusResponse {
    return {
      enabled: this.storage.isEnabled(),
      maxBytes: EVIDENCE_FILE_MAX_BYTES,
      allowedTypes: [...EVIDENCE_FILE_EXTENSIONS],
    };
  }
}
