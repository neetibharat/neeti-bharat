import { HttpStatus, Injectable } from '@nestjs/common';
import type { JobRole } from '@neeti-bharat/shared';
import { AppException } from '../../core/common/app.exception';
import { PeopleRepository } from '../repositories/people.repository';

export interface DirectoryPerson {
  id: string;
  name: string;
}

/** Read-only view of who works at the company, for modules that give work to a person. */
@Injectable()
export class PersonDirectory {
  constructor(private readonly people: PeopleRepository) {}

  /** The person with this email, if they still work here. */
  findByEmail(email: string): Promise<DirectoryPerson | null> {
    return this.people.findActiveByEmail(email);
  }

  /** The jobs one person holds. */
  async rolesHeldBy(personId: string): Promise<JobRole[]> {
    const held = await this.people.rolesOf(personId);
    return held.map((assignment) => assignment.role);
  }

  /** The person, who must still work here. Anything else is a bad request, since the caller named someone who cannot be given work. */
  async requireActive(id: string): Promise<DirectoryPerson> {
    const person = await this.people.findActiveById(id);
    if (!person) throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    return person;
  }

  /** Which jobs each person holds, for everyone at once. */
  async rolesByPerson(): Promise<Map<string, Set<string>>> {
    const byPerson = new Map<string, Set<string>>();
    for (const { personId, role } of await this.people.assignments()) {
      byPerson.set(personId, (byPerson.get(personId) ?? new Set()).add(role));
    }
    return byPerson;
  }

  /** One page of the people who have not left, by name. */
  activePage(query: { q?: string; page: number; limit: number }) {
    return this.people.activePage(query);
  }

  /** Everyone who has not left, by name. */
  async activePeople(): Promise<DirectoryPerson[]> {
    return this.people.activeOptions();
  }
}
