import { nothingToCheck } from '../../outcome';
import { GithubAccessError } from '../github-api';
import type { GithubCheck } from './scope';

interface Member {
  login: string;
}

const OWNERS_MIN = 2;
const OWNERS_MAX = 5;

/** Everyone in the organisation signs in with a second step. People are counted, never named. */
export const twoFactor: GithubCheck = {
  id: 'github_two_factor',
  run: async ({ api, account }) => {
    if (account.type !== 'Organization') return nothingToCheck;
    try {
      const without = await api.list<Member>(
        `/orgs/${account.login}/members?filter=2fa_disabled&per_page=100`,
      );
      return without.length === 0
        ? { status: 'pass' }
        : { status: 'fail', values: { count: without.length } };
    } catch (error) {
      if (error instanceof GithubAccessError) return { status: 'skipped', reason: 'access' };
      throw error;
    }
  },
};

/** Two to five owners: one is a single point of failure, and many is a lot of power. */
export const ownerCount: GithubCheck = {
  id: 'github_owner_count',
  run: async ({ api, account }) => {
    if (account.type !== 'Organization') return nothingToCheck;
    const owners = await api.list<Member>(`/orgs/${account.login}/members?role=admin&per_page=100`);
    const fine = owners.length >= OWNERS_MIN && owners.length <= OWNERS_MAX;
    return {
      status: fine ? 'pass' : 'warn',
      values: { count: owners.length, min: OWNERS_MIN, max: OWNERS_MAX },
    };
  },
};
