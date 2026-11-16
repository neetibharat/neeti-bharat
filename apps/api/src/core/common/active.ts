import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

interface Archivable {
  archivedAt: Date | null;
}

/** A row that exists and has not been archived. Anything else is not found. */
export function activeOrNotFound<T extends Archivable>(row: T | null | undefined): T {
  if (!row || row.archivedAt) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
  return row;
}

/** A row that exists and has been archived, so it can be brought back. Anything else is not found. */
export function archivedOrNotFound<T extends Archivable>(row: T | null | undefined): T {
  if (!row?.archivedAt) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
  return row;
}
