import type { PersonResponse } from '@dpdp-kit/shared';
import { matchesSearch } from './filters';

/** The people whose name, email, job title or department contains the search, ignoring case. */
export function searchPeople(people: PersonResponse[], query: string): PersonResponse[] {
  return people.filter((person) =>
    matchesSearch([person.name, person.email, person.jobTitle, person.department], query),
  );
}
