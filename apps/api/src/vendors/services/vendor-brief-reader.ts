import { Injectable } from '@nestjs/common';
import { VendorRepository } from '../repositories/vendor.repository';

/** What a vendor in use is, in a few words: what it does, what data it is given and where it works. */
export interface VendorBrief {
  name: string;
  service: string;
  category: string;
  dataKinds: string[];
  /** India, abroad or both, or null until it is said. */
  location: string | null;
}

/** Read-only view of the vendors in use, for modules that describe the company. */
@Injectable()
export class VendorBriefReader {
  constructor(private readonly vendors: VendorRepository) {}

  async active(): Promise<VendorBrief[]> {
    const rows = await this.vendors.findActive();
    return rows.map((row) => ({
      name: row.name,
      service: row.service,
      category: row.category,
      dataKinds: row.dataKinds,
      location: row.location,
    }));
  }
}
