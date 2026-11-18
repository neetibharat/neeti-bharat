import { GithubNotFoundError, type GithubApi } from '../github-api';

export interface FakeGithubData {
  /** What a read answers, by path. An `Error` is thrown instead; a path that is not here is a 404. */
  gets?: Record<string, unknown>;
  /** The items of a list, by path. A path that is not here is an empty list. */
  lists?: Record<string, unknown[]>;
  /** The status of a yes-or-no read, by path. A path that is not here is a 404. */
  statuses?: Record<string, number>;
}

/** Stands in for GitHub in tests: it answers from a table, so no test leaves the machine. */
export function fakeGithub({
  gets = {},
  lists = {},
  statuses = {},
}: FakeGithubData = {}): GithubApi {
  return {
    get: <T>(path: string): Promise<T> => {
      const answer = gets[path];
      if (answer instanceof Error) return Promise.reject(answer);
      if (path in gets) return Promise.resolve(answer as T);
      return Promise.reject(new GithubNotFoundError('Not found'));
    },
    list: <T>(path: string): Promise<T[]> => {
      const answer = lists[path] ?? [];
      return Promise.resolve(answer as T[]);
    },
    status: (path: string): Promise<number> => Promise.resolve(statuses[path] ?? 404),
  };
}
