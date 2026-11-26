import { createHash } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import {
  EVIDENCE_FILE_EXTENSIONS,
  EVIDENCE_FILE_MAX_BYTES,
  EVIDENCE_FILE_NAME_MAX_LENGTH,
  type EvidenceFileExtension,
} from '@neeti-bharat/shared';
import { AppException } from '../../core/common/app.exception';

/** What an upload looks like once multer has read it. */
export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

export interface CheckedFile {
  /** Cleaned of paths and control characters, at most 120 characters, extension kept. */
  fileName: string;
  /** Set from the extension after the contents were checked, never taken from the client. */
  contentType: string;
  sha256: string;
}

const OFFICE = 'application/vnd.openxmlformats-officedocument';

const CONTENT_TYPES: Record<EvidenceFileExtension, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  docx: `${OFFICE}.wordprocessingml.document`,
  xlsx: `${OFFICE}.spreadsheetml.sheet`,
  pptx: `${OFFICE}.presentationml.presentation`,
  zip: 'application/zip',
};

const startsWith = (file: Buffer, signature: string, offset = 0): boolean =>
  file.subarray(offset, offset + signature.length).toString('latin1') === signature;

const isZip = (file: Buffer): boolean => startsWith(file, 'PK\x03\x04');

/** Word, Excel and PowerPoint files are zips that always hold this entry. */
const isOffice = (file: Buffer): boolean => isZip(file) && file.includes('[Content_Types].xml');

function isText(file: Buffer): boolean {
  if (file.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(file);
    return true;
  } catch {
    return false;
  }
}

const CONTENT_CHECKS: Record<EvidenceFileExtension, (file: Buffer) => boolean> = {
  pdf: (file) => startsWith(file, '%PDF-'),
  png: (file) => startsWith(file, '\x89PNG\r\n\x1a\n'),
  jpg: (file) => startsWith(file, '\xff\xd8\xff'),
  jpeg: (file) => startsWith(file, '\xff\xd8\xff'),
  webp: (file) => startsWith(file, 'RIFF') && startsWith(file, 'WEBP', 8),
  gif: (file) => startsWith(file, 'GIF87a') || startsWith(file, 'GIF89a'),
  txt: isText,
  csv: isText,
  docx: isOffice,
  xlsx: isOffice,
  pptx: isOffice,
  zip: isZip,
};

const isPrintable = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  const control = code < 32 || (code >= 127 && code <= 159);
  const directionOverride =
    (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
  return !control && !directionOverride;
};

/** Strips folders, control and direction-override characters, collapses spaces, and shortens keeping the extension. */
export function sanitiseFileName(raw: string): string {
  const last = raw.split(/[\\/]/).pop() ?? '';
  const name = [...last].filter(isPrintable).join('').replace(/\s+/g, ' ').trim();
  if (name.length <= EVIDENCE_FILE_NAME_MAX_LENGTH) return name;
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : '';
  return name.slice(0, EVIDENCE_FILE_NAME_MAX_LENGTH - extension.length).trimEnd() + extension;
}

/** The part after the last dot, lower case, or an empty string. */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

const isAllowed = (extension: string): extension is EvidenceFileExtension =>
  (EVIDENCE_FILE_EXTENSIONS as readonly string[]).includes(extension);

/** Refuses an empty, oversized or wrongly typed file. The contents are checked, not the client's word for them. */
export function checkEvidenceFile(file: UploadedFile): CheckedFile {
  if (file.buffer.length === 0) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
  if (file.buffer.length > EVIDENCE_FILE_MAX_BYTES) {
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

/** Where a file lives in the bucket, under its organisation. The id keeps two uploads of the same name apart; the name is made safe for any provider. */
export function evidenceFileKey(
  organizationId: string,
  controlId: string,
  id: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, '-');
  return `organizations/${organizationId}/evidence/${controlId}/${id}/${safeName}`;
}
