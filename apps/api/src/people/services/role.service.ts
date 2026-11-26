import { HttpStatus, Injectable } from '@nestjs/common';
import type { JobRole } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { PeopleRepository } from '../repositories/people.repository';

/** Who holds each named job. A job has one holder, or none. */
@Injectable()
export class RoleService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly activity: ActivityService,
  ) {}

  /** Gives a job to a person, or with `null` leaves it vacant. Giving it to its current holder does nothing. */
  async assign(role: JobRole, personId: string | null, actor: ActivityActor): Promise<void> {
    const current = await this.people.findRoleHolding(role);
    if (personId === null) return this.vacate(role, current?.person, actor);
    if (current?.personId === personId) return;

    const person = await this.people.findById(personId);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (person.status === 'left') throw new AppException('CONFLICT', HttpStatus.CONFLICT);

    await this.people.assignRole(role, personId, new Date());
    await this.activity.record({
      actor,
      action: 'ROLE_ASSIGNED',
      subject: { type: 'role', id: role },
      details: { jobRole: role, name: person.name },
    });
  }

  private async vacate(
    role: JobRole,
    holder: { name: string } | undefined,
    actor: ActivityActor,
  ): Promise<void> {
    if (!holder) return;
    await this.people.clearRole(role);
    await this.activity.record({
      actor,
      action: 'ROLE_UNASSIGNED',
      subject: { type: 'role', id: role },
      details: { jobRole: role, name: holder.name },
    });
  }
}
