import { Injectable } from '@nestjs/common';
import { VendorRepository } from '../repositories/vendor.repository';

/** The little of a vendor that makes it work for someone: whose it is, and when its review falls due. */
export interface WorkVendor {
  id: string;
  name: string;
  /** Who answers for it, or null when nobody is named. */
  ownerId: string | null;
  reviewDueOn: Date | null;
}

/** Read-only view of the vendors in use, for modules that give work to a person. */
@Injectable()
export class VendorWorkReader {
  constructor(private readonly vendors: VendorRepository) {}

  async active(): Promise<WorkVendor[]> {
    const rows = await this.vendors.findActive();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerId: row.ownerId,
      reviewDueOn: row.nextReviewOn,
    }));
  }
}
