import { Injectable } from '@nestjs/common';
import {
  PROOF_CHECKS,
  PROOF_SNAPSHOT_GAP_DAYS,
  type ConnectionCheckResult,
  type ConnectionProvider,
} from '@neeti-bharat/shared';
import { snapshotFor, type Accepted } from '../../connections/utils/proof-snapshot';
import { SystemProofService } from './system-proof.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Leaves a dated note on the proofs that a run of the checks backs up. */
@Injectable()
export class ProofSnapshotService {
  constructor(private readonly system: SystemProofService) {}

  /** Every proof the run backs up gets one note, unless this connection left one on it within the last week. */
  async record(
    connection: { name: string; provider: ConnectionProvider },
    results: ConnectionCheckResult[],
    accepted: Accepted,
    now: Date,
  ): Promise<void> {
    const title = `Cloud checks: ${connection.name}`.slice(0, 120);
    for (const proofId of Object.keys(PROOF_CHECKS)) {
      const note = snapshotFor(proofId, connection, results, accepted, now);
      if (!note) continue;
      const last = await this.system.latestAt(proofId, title);
      const recent =
        last !== null && now.getTime() - last.getTime() < PROOF_SNAPSHOT_GAP_DAYS * DAY_MS;
      if (!recent) await this.system.attachNote(proofId, title, note.text);
    }
  }
}
