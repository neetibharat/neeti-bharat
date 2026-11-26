import type { GithubRepositoryOption, GithubSelection } from '@neeti-bharat/shared';

/** What a GitHub connection keeps in the clear about which repositories it reads. */
export function selectionOf(identifiers: Record<string, string>): GithubSelection {
  const names = (identifiers.repositories ?? '').split(',').filter(Boolean);
  return identifiers.mode === 'selected'
    ? { mode: 'selected', repositories: names }
    : { mode: 'all', repositories: [] };
}

/** The repositories whose name holds what was typed, in any case. */
export function matchingRepositories(
  repositories: readonly GithubRepositoryOption[],
  query: string,
): GithubRepositoryOption[] {
  const needle = query.trim().toLowerCase();
  return repositories.filter((repository) => repository.name.toLowerCase().includes(needle));
}

/** The picked names with one more, or without it when it was there already. */
export function toggled(picked: readonly string[], name: string): string[] {
  return picked.includes(name) ? picked.filter((item) => item !== name) : [...picked, name];
}

/** The picked names, plus every one of these that was not, or without all of these when they were all picked. */
export function withAll(picked: readonly string[], names: readonly string[]): string[] {
  return [...new Set([...picked, ...names])];
}

export function withoutAll(picked: readonly string[], names: readonly string[]): string[] {
  const drop = new Set(names);
  return picked.filter((name) => !drop.has(name));
}

/** All repositories can always be read; picking some needs at least one picked. */
export const selectionIsUsable = (selection: GithubSelection): boolean =>
  selection.mode === 'all' || selection.repositories.length > 0;

/** What is sent: names are only kept when the mode needs them. */
export const selectionToSend = (selection: GithubSelection): GithubSelection => ({
  mode: selection.mode,
  repositories: selection.mode === 'selected' ? selection.repositories : [],
});

/** A short phrase for the list: "All repositories" or how many were picked. */
export function pickedCount(selection: GithubSelection): number | null {
  return selection.mode === 'selected' ? selection.repositories.length : null;
}
