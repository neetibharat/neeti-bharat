import { Injectable, Logger } from '@nestjs/common';
import { CONNECTION_SCHEDULE_HOURS, type ConnectionSchedule } from '@dpdp-kit/shared';
import type { ActivityActor } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import type { Connection } from '../../generated/prisma/client';
import { ConnectionRunRepository } from '../repositories/connection-run.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { ConnectionsService } from './connections.service';

const HOUR_MS = 60 * 60 * 1000;

/** Who the activity log names for a check nobody asked for. */
export const SCHEDULE_ACTOR: ActivityActor = { label: 'Scheduled check' };

type Scheduled = Exclude<ConnectionSchedule, 'off'>;

const hoursOf = (schedule: string): number => CONNECTION_SCHEDULE_HOURS[schedule as Scheduled];

/** When a check is due again, counted from the later of the last check and the last try, which may have failed. */
export function nextDue(
  schedule: ConnectionSchedule,
  lastRanAt: Date | null,
  lastAttemptAt: Date | null,
): Date | null {
  if (schedule === 'off') return null;
  const latest = Math.max(lastRanAt?.getTime() ?? 0, lastAttemptAt?.getTime() ?? 0);
  return new Date(latest + hoursOf(schedule) * HOUR_MS);
}

/** Checks the connections whose schedule says they are due. */
@Injectable()
export class ConnectionScheduleService {
  private readonly logger = new Logger(ConnectionScheduleService.name);

  constructor(
    private readonly connections: ConnectionRepository,
    private readonly runs: ConnectionRunRepository,
    private readonly service: ConnectionsService,
  ) {}

  /** Every open organisation. One that fails is logged and does not stop the others. */
  async runAllDue(now: Date): Promise<void> {
    for (const organization of await this.connections.openOrganizations()) {
      try {
        await runInOrganization(organization.id, () => this.runDue(now));
      } catch (error) {
        this.logger.error(`Scheduled checks for ${organization.id} failed`, error as Error);
      }
    }
  }

  private async runDue(now: Date): Promise<void> {
    for (const row of await this.connections.scheduled()) {
      if (await this.isDue(row, now)) await this.runOne(row, now);
    }
  }

  private async isDue(row: Connection, now: Date): Promise<boolean> {
    const due = nextDue(
      row.schedule as ConnectionSchedule,
      // A run of only some checks does not put off the next full one.
      await this.runs.lastRanAt(row.id, true),
      row.lastAttemptAt,
    );
    return due !== null && due <= now;
  }

  /** Takes the try first, so another copy of the API that looks at the same moment leaves it alone. */
  private async runOne(row: Connection, now: Date): Promise<void> {
    const since = new Date(now.getTime() - hoursOf(row.schedule) * HOUR_MS);
    if (!(await this.connections.claimAttempt(row.id, since, now))) return;
    await this.service.runBySchedule(row, SCHEDULE_ACTOR);
  }
}
