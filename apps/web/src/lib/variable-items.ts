export interface Named {
  key: string;
  label: string;
}

/** The company answers that match what has been typed after `{{`, by their name or their key. All of them when nothing is typed. */
export function matchingAnswers<T extends Named>(all: readonly T[], query: string): T[] {
  // A closing brace means the answer is already written: there is nothing left to offer.
  if (query.includes('}')) return [];
  const wanted = query.trim().toLowerCase();
  return all.filter(
    (item) => item.label.toLowerCase().includes(wanted) || item.key.toLowerCase().includes(wanted),
  );
}

/**
 * How much of the text after the cursor belongs to the variable the cursor is inside: the rest of its name and the
 * closing braces, when they are there. Choosing an answer replaces all of it, so `{{grievanceR|ceEmail}}` becomes one
 * variable, not two pieces. Without closing braces nothing is taken, so `{{|` in front of plain text leaves it alone.
 */
export function restOfVariable(textAfterCursor: string): number {
  return /^[\w:-]*\}\}/.exec(textAfterCursor)?.[0].length ?? 0;
}
