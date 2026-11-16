import { createHash } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { LOGO_EXTENSIONS, LOGO_MAX_BYTES, type LogoExtension } from '@dpdp-kit/shared';
import { AppException } from '../../core/common/app.exception';
import { extensionOf, sanitiseFileName } from '../../frameworks/utils/evidence-file';
import type { UploadedFile } from '../../frameworks/utils/evidence-file';

export interface CheckedLogo {
  fileName: string;
  /** Set from the extension after the contents were checked, never taken from the client. */
  contentType: string;
  sha256: string;
}

const CONTENT_TYPES: Record<LogoExtension, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const startsWith = (file: Buffer, signature: string, offset = 0): boolean =>
  file.subarray(offset, offset + signature.length).toString('latin1') === signature;

const CONTENT_CHECKS: Record<LogoExtension, (file: Buffer) => boolean> = {
  png: (file) => startsWith(file, '\x89PNG\r\n\x1a\n'),
  jpg: (file) => startsWith(file, '\xff\xd8\xff'),
  jpeg: (file) => startsWith(file, '\xff\xd8\xff'),
  webp: (file) => startsWith(file, 'RIFF') && startsWith(file, 'WEBP', 8),
};

const isAllowed = (extension: string): extension is LogoExtension =>
  (LOGO_EXTENSIONS as readonly string[]).includes(extension);

/** Refuses an empty, oversized or wrongly typed picture. The contents are checked, not the client's word for them. */
export function checkLogoFile(file: UploadedFile): CheckedLogo {
  if (file.buffer.length === 0) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
  if (file.buffer.length > LOGO_MAX_BYTES) {
    throw new AppException('FILE_TOO_LARGE', HttpStatus.PAYLOAD_TOO_LARGE);
  }
  const fileName = sanitiseFileName(file.originalname);
  const extension = extensionOf(fileName);
  if (!isAllowed(extension) || !CONTENT_CHECKS[extension](file.buffer)) {
    throw new AppException('FILE_TYPE_NOT_ALLOWED', HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }
  const sha256 = createHash('sha256').update(file.buffer).digest('hex');
  return { fileName, contentType: CONTENT_TYPES[extension], sha256 };
}

/** Where the logo lives in the bucket, under its organisation. The id keeps a new upload apart from the one it replaces. */
export function logoFileKey(organizationId: string, id: string, fileName: string): string {
  return `organizations/${organizationId}/logo/${id}/${fileName.replace(/[^A-Za-z0-9._-]+/g, '-')}`;
}
