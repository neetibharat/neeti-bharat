import type { SearchHit, SearchKind } from '@neeti-bharat/shared';
import type { Icon } from '@tabler/icons-react';
import {
  SEARCH_ICONS,
  quickActionsFor,
  searchHref,
  searchablePages,
  type RecentSearch,
} from './search';

export interface SearchItem {
  key: string;
  href: string;
  title: string;
  detail?: string;
  tag: string;
  icon: Icon;
}

export type SearchGroupId = 'recent' | 'actions' | 'pages' | 'records';

export interface SearchGroup {
  id: SearchGroupId;
  items: SearchItem[];
}

export interface SearchWho {
  isAdmin: boolean;
  canEdit: boolean;
  /** The install has an AI service, so its page can be found. */
  aiOn?: boolean;
}

/** Looks up words: `t` for the search's own, `tNav` for the names of pages. */
export interface SearchWords {
  t: (key: string) => string;
  tNav: (key: string) => string;
}

const matches = (text: string, needle: string) => text.toLowerCase().includes(needle);

export function pageItems(needle: string, who: SearchWho, words: SearchWords): SearchItem[] {
  return searchablePages(who.isAdmin, who.aiOn)
    .map((page) => ({ ...page, title: words.tNav(page.id) }))
    .filter((page) => matches(page.title, needle))
    .map((page) => ({
      key: `page:${page.id}`,
      href: page.href,
      icon: page.icon,
      title: page.title,
      tag: words.t('page'),
    }));
}

export function actionItems(needle: string, who: SearchWho, words: SearchWords): SearchItem[] {
  return quickActionsFor(who.canEdit, who.isAdmin)
    .map((action) => ({ ...action, title: words.t(`actions.${action.id}`) }))
    .filter((action) => matches(action.title, needle))
    .map((action) => ({
      key: `action:${action.id}`,
      href: action.href,
      icon: action.icon,
      title: action.title,
      tag: words.t('action'),
    }));
}

export function recordItems(hits: SearchHit[], who: SearchWho, words: SearchWords): SearchItem[] {
  return hits
    .filter((hit) => hit.kind !== 'person' || who.isAdmin)
    .map((hit) => ({
      key: `${hit.kind}:${hit.id}`,
      href: searchHref(hit),
      icon: SEARCH_ICONS[hit.kind],
      title: hit.title,
      detail: hit.detail,
      tag: words.t(`kinds.${hit.kind}`),
    }));
}

/** The icon of a result opened before, worked out again from its key. */
function iconOf(key: string, who: SearchWho): Icon | undefined {
  const [group, id = ''] = key.split(':');
  if (group === 'page')
    return searchablePages(who.isAdmin, true).find((page) => page.id === id)?.icon;
  if (group === 'action')
    return quickActionsFor(true, true).find((action) => action.id === id)?.icon;
  return SEARCH_ICONS[group as SearchKind];
}

export function recentItems(
  recent: RecentSearch[],
  who: SearchWho,
  words: SearchWords,
): SearchItem[] {
  return recent.flatMap((entry) => {
    const icon = iconOf(entry.key, who);
    if (!icon) return [];
    const group = entry.key.split(':')[0]!;
    const tag = group === 'page' || group === 'action' ? words.t(group) : words.t(`kinds.${group}`);
    return [{ ...entry, icon, tag }];
  });
}

export interface GroupInput {
  needle: string;
  who: SearchWho;
  words: SearchWords;
  hits: SearchHit[];
  recent: RecentSearch[];
}

/** What to show for what has been typed. Nothing typed shows what was opened lately and the quick actions. */
export function buildGroups({ needle, who, words, hits, recent }: GroupInput): SearchGroup[] {
  const recents = needle ? [] : recentItems(recent, who, words);
  // A result cannot be listed twice, so an action already under Recent is left out of the actions.
  const seen = new Set(recents.map((item) => item.key));
  const actions = actionItems(needle, who, words).filter((item) => !seen.has(item.key));
  const showPages = needle !== '' || (recents.length === 0 && actions.length === 0);
  const groups: SearchGroup[] = [
    { id: 'recent', items: recents },
    { id: 'actions', items: actions },
    { id: 'pages', items: showPages ? pageItems(needle, who, words) : [] },
    { id: 'records', items: recordItems(hits, who, words) },
  ];
  return groups.filter((group) => group.items.length > 0);
}
