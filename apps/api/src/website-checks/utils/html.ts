export interface PageLink {
  href: string;
  text: string;
}

const LINK = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();
const stripTags = (html: string): string => html.replace(/<[^>]*>/g, ' ');

/** Every link on the page with the words that are shown for it. */
export function linksOf(html: string): PageLink[] {
  return [...html.matchAll(LINK)].map((match) => ({
    href: (match[1] ?? match[2] ?? match[3] ?? '').trim(),
    text: collapse(stripTags(match[4] ?? '')),
  }));
}

/** Every email address on the page, lower case, each once. Addresses in mailto links count. */
export function emailsOf(html: string): string[] {
  const found = html.match(EMAIL) ?? [];
  return [...new Set(found.map((email) => email.toLowerCase()))];
}
