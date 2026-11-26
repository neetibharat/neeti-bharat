import { Injectable } from '@nestjs/common';
import type { RequestType } from '@neeti-bharat/shared';
import { RequestRepository } from '../repositories/request.repository';
import { isOverdue } from '../utils/request-due';

/** The little of an open request that makes it work for someone. */
export interface OpenRequest {
  id: string;
  type: RequestType;
  personName: string;
  dueAt: Date;
  overdue: boolean;
  /** Who deals with it, or null when it is the DPO's. */
  assigneeId: string | null;
}

/** Read-only view of the requests that are not done, for modules that give work to a person. */
@Injectable()
export class OpenRequestReader {
  constructor(private readonly requests: RequestRepository) {}

  async open(): Promise<OpenRequest[]> {
    const rows = await this.requests.findOpen();
    const now = new Date();
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      personName: row.personName,
      dueAt: row.dueAt,
      overdue: isOverdue({ status: row.status, dueAt: row.dueAt, now }),
      assigneeId: row.assigneeId,
    }));
  }
}
