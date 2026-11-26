import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LOGO_LINK_SECONDS, type CompanyLogoResponse } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { FileStorage } from '../../core/storage/file-storage';
import type { UploadedFile } from '../../frameworks/utils/evidence-file';
import { CompanyLogoRepository } from '../repositories/company-logo.repository';
import { checkLogoFile, logoFileKey } from '../utils/logo-file';

const logger = new Logger('CompanyLogo');

@Injectable()
export class CompanyLogoService {
  constructor(
    private readonly logos: CompanyLogoRepository,
    private readonly storage: FileStorage,
    private readonly activity: ActivityService,
  ) {}

  /** The logo with a short-lived link to it, or null when none is set or storage is off. */
  async get(): Promise<CompanyLogoResponse> {
    const row = await this.logos.find();
    if (!row || !this.storage.isEnabled()) return { logo: null };
    const url = await this.storage.signedDownloadUrl(row.fileKey, {
      fileName: row.fileName,
      contentType: row.fileType,
      expiresInSeconds: LOGO_LINK_SECONDS,
    });
    return { logo: { url, fileName: row.fileName, updatedAt: row.updatedAt.toISOString() } };
  }

  /**
   * Sets the logo. The new picture is stored first and the old one removed last, so a failure never leaves the
   * company without a logo it had, and storage keeps nothing the database does not know about.
   */
  async set(file: UploadedFile | undefined, actor: ActivityActor): Promise<CompanyLogoResponse> {
    if (!this.storage.isEnabled()) {
      throw new AppException('STORAGE_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!file) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    const checked = checkLogoFile(file);
    const key = logoFileKey(currentOrganizationId(), randomUUID(), checked.fileName);
    await this.storage.put(key, file.buffer, {
      contentType: checked.contentType,
      sha256: checked.sha256,
    });
    try {
      const previous = await this.logos.find();
      await this.logos.save({
        fileKey: key,
        fileName: checked.fileName,
        fileType: checked.contentType,
        fileSize: file.buffer.length,
        fileSha256: checked.sha256,
        updatedByName: actor.label,
      });
      await this.activity.record({
        actor,
        action: 'LOGO_CHANGED',
        subject: { type: 'company_logo' },
        details: { fileName: checked.fileName },
      });
      if (previous) await this.discard(previous.fileKey);
    } catch (error) {
      await this.discard(key);
      throw error;
    }
    return this.get();
  }

  async remove(actor: ActivityActor): Promise<void> {
    const row = await this.logos.find();
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    await this.logos.remove();
    await this.activity.record({
      actor,
      action: 'LOGO_REMOVED',
      subject: { type: 'company_logo' },
      details: { fileName: row.fileName },
    });
    await this.discard(row.fileKey);
  }

  /** Removes a picture from storage. A failure is logged and does not undo the change that was made. */
  private async discard(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
    } catch (error) {
      logger.warn(`Could not remove ${key} from storage: ${String(error)}`);
    }
  }
}
