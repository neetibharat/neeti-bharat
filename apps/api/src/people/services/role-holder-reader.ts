import { Injectable } from '@nestjs/common';
import type { JobRole } from '@neeti-bharat/shared';
import { PeopleRepository } from '../repositories/people.repository';

export interface RoleHolder {
  name: string;
  email: string;
}

/** Read-only view of who holds a job, for modules that need to name them, such as the company profile. */
@Injectable()
export class RoleHolderReader {
  constructor(private readonly people: PeopleRepository) {}

  async holderOf(role: JobRole): Promise<RoleHolder | null> {
    const holding = await this.people.findRoleHolding(role);
    return holding ? { name: holding.person.name, email: holding.person.email } : null;
  }
}
