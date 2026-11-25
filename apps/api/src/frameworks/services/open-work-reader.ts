import { Injectable } from '@nestjs/common';
import { OpenBreachReader } from '../../breaches/services/open-breach-reader';
import { OpenRequestReader } from '../../requests/services/open-request-reader';
import { TrainingWorkReader } from '../../training/services/training-work-reader';
import { VendorWorkReader } from '../../vendors/services/vendor-work-reader';
import type { WorkBreach, WorkRequest, WorkTraining, WorkVendor } from '../utils/my-work';

/** The open breaches and requests, and the vendors in use, which people's work is worked out from. */
export interface OpenWork {
  breaches: WorkBreach[];
  requests: WorkRequest[];
  vendors: WorkVendor[];
  training: WorkTraining[];
}

/** Reads, in one place, what other modules give people to do, so My work asks for it once. */
@Injectable()
export class OpenWorkReader {
  constructor(
    private readonly breaches: OpenBreachReader,
    private readonly requests: OpenRequestReader,
    private readonly vendors: VendorWorkReader,
    private readonly training: TrainingWorkReader,
  ) {}

  async read(): Promise<OpenWork> {
    const [breaches, requests, vendors, training] = await Promise.all([
      this.breaches.open(),
      this.requests.open(),
      this.vendors.active(),
      this.training.pending(new Date()),
    ]);
    return { breaches, requests, vendors, training };
  }
}
