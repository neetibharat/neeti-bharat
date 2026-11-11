import type { PersonResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { searchPeople } from './people-filter';

const person = (name: string, over: Partial<PersonResponse> = {}): PersonResponse => ({
  id: name,
  name,
  email: `${name.toLowerCase()}@acme.in`,
  department: null,
  jobTitle: null,
  status: 'active',
  leftAt: null,
  access: 'member',
  invited: false,
  roles: [],
  ...over,
});

describe('searchPeople', () => {
  const people = [
    person('Asha', { jobTitle: 'Security engineer' }),
    person('Ravi', { department: 'Legal' }),
  ];

  it('finds by name, email, job title or department, ignoring case', () => {
    expect(searchPeople(people, 'ASH').map((p) => p.name)).toEqual(['Asha']);
    expect(searchPeople(people, 'ravi@').map((p) => p.name)).toEqual(['Ravi']);
    expect(searchPeople(people, 'engineer').map((p) => p.name)).toEqual(['Asha']);
    expect(searchPeople(people, 'legal').map((p) => p.name)).toEqual(['Ravi']);
  });

  it('returns everyone for an empty search', () => {
    expect(searchPeople(people, '  ')).toHaveLength(2);
  });
});
