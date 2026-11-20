import { TEMPLATES_PATH, type ProofTemplate } from '@dpdp-kit/shared';

/** A `/` being typed at the start of a word, and what follows it. */
export interface TemplateTrigger {
  /** Where the `/` is. */
  start: number;
  /** Where the cursor is, which is where the word so far ends. */
  end: number;
  /** What was typed after the `/`, without a leading `templates/`. */
  query: string;
}

/** The word the cursor is in, when it starts with `/` and has no spaces. Nothing when it is not that. */
export function templateTrigger(text: string, cursor: number): TemplateTrigger | null {
  const before = text.slice(0, cursor);
  const match = /(?:^|\s)(\/[^\s]*)$/.exec(before);
  if (!match) return null;
  const word = match[1]!;
  const start = cursor - word.length;
  const typed = word.slice(1);
  const query = typed.startsWith('templates/') ? typed.slice('templates/'.length) : typed;
  // Part way through typing `templates/` is still the start of the path, not a search.
  return { start, end: cursor, query: 'templates/'.startsWith(typed) ? '' : query };
}

/** The templates whose title or file name holds every word typed, in the order they are listed. */
export function matchingTemplates(
  templates: readonly ProofTemplate[],
  query: string,
): ProofTemplate[] {
  const words = query
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
  return templates.filter((template) => {
    const haystack = `${template.title} ${template.file}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

/** The text with the word being typed replaced by the template's path, and where the cursor goes after it. */
export function insertTemplate(
  text: string,
  trigger: TemplateTrigger,
  template: ProofTemplate,
): { text: string; cursor: number } {
  const path = `${TEMPLATES_PATH}${template.file}`;
  return {
    text: text.slice(0, trigger.start) + path + text.slice(trigger.end),
    cursor: trigger.start + path.length,
  };
}
