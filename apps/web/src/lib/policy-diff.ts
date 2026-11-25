import { documentToMarkdown, type PolicyDocument } from '@dpdp-kit/shared';

/** The text of a policy as lines, one for each heading, paragraph and list item, with the company answers left as {{keys}}. */
export function policyLines(document: PolicyDocument): string[] {
  return documentToMarkdown(document)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

/** A line without its bold and italic signs, so the diff shows words and not Markdown. */
export function plainLine(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<![*\w])\*(?!\s)(.+?)\*(?![*\w])/g, '$1');
}

type Step = { kind: 'same' | 'del' | 'add'; value: string };

/** For each pair of positions, how long a run the rest of the two lists share. */
function sharedRuns(before: string[], after: string[]): { table: Uint16Array; width: number } {
  const width = after.length + 1;
  const table = new Uint16Array((before.length + 1) * width);
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i * width + j] =
        before[i] === after[j]
          ? table[(i + 1) * width + j + 1]! + 1
          : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
    }
  }
  return { table, width };
}

/** What the next step is, given where each list has got to. */
function nextMove(
  before: string[],
  after: string[],
  at: { i: number; j: number },
  runFrom: (i: number, j: number) => number,
): Step['kind'] {
  const { i, j } = at;
  if (i >= before.length) return 'add';
  if (j >= after.length) return 'del';
  if (before[i] === after[j]) return 'same';
  return runFrom(i + 1, j) >= runFrom(i, j + 1) ? 'del' : 'add';
}

/** The longest run the two lists share, then what was taken out and what was put in around it. */
function diffSteps(before: string[], after: string[]): Step[] {
  const { table, width } = sharedRuns(before, after);
  const runFrom = (i: number, j: number) => table[i * width + j]!;
  const steps: Step[] = [];
  const at = { i: 0, j: 0 };
  while (at.i < before.length || at.j < after.length) {
    const kind = nextMove(before, after, at, runFrom);
    steps.push({ kind, value: kind === 'add' ? after[at.j]! : before[at.i]! });
    if (kind !== 'add') at.i += 1;
    if (kind !== 'del') at.j += 1;
  }
  return steps;
}

export type DiffRow =
  | { kind: 'same'; text: string }
  | { kind: 'changed'; before: string; after: string }
  | { kind: 'removed'; text: string }
  | { kind: 'added'; text: string };

/** Lines that were taken out and put in next to each other are one line that changed. */
function pairUp(steps: Step[]): DiffRow[] {
  const rows: DiffRow[] = [];
  for (let at = 0; at < steps.length;) {
    const step = steps[at]!;
    if (step.kind === 'same') {
      rows.push({ kind: 'same', text: step.value });
      at += 1;
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (steps[at]?.kind === 'del') removed.push(steps[at++]!.value);
    while (steps[at]?.kind === 'add') added.push(steps[at++]!.value);
    const pairs = Math.min(removed.length, added.length);
    for (let k = 0; k < pairs; k += 1)
      rows.push({ kind: 'changed', before: removed[k]!, after: added[k]! });
    removed.slice(pairs).forEach((text) => rows.push({ kind: 'removed', text }));
    added.slice(pairs).forEach((text) => rows.push({ kind: 'added', text }));
  }
  return rows;
}

/** What changed between two versions of a policy's text, line by line. */
export function diffRows(before: string[], after: string[]): DiffRow[] {
  return pairUp(diffSteps(before, after));
}

export const changedLines = (rows: DiffRow[]): number =>
  rows.filter((row) => row.kind !== 'same').length;

export interface Segment {
  text: string;
  changed: boolean;
}

const words = (text: string): string[] => text.split(/(\s+)/).filter((part) => part !== '');

/** A space between two changed words is part of the change, so a changed phrase is marked as one. */
function bridgeGaps(parts: Segment[]): Segment[] {
  return parts.map((part, index) => {
    const between =
      !part.changed &&
      part.text.trim() === '' &&
      parts[index - 1]?.changed === true &&
      parts[index + 1]?.changed === true;
    return between ? { ...part, changed: true } : part;
  });
}

function merge(parts: Segment[]): Segment[] {
  return bridgeGaps(parts).reduce<Segment[]>((out, part) => {
    const last = out[out.length - 1];
    if (last && last.changed === part.changed) last.text += part.text;
    else out.push({ ...part });
    return out;
  }, []);
}

/** The two versions of one line, cut into pieces that are the same and pieces that are not, word by word. */
export function wordSegments(
  before: string,
  after: string,
): { before: Segment[]; after: Segment[] } {
  const steps = diffSteps(words(before), words(after));
  return {
    before: merge(
      steps
        .filter((s) => s.kind !== 'add')
        .map((s) => ({ text: s.value, changed: s.kind === 'del' })),
    ),
    after: merge(
      steps
        .filter((s) => s.kind !== 'del')
        .map((s) => ({ text: s.value, changed: s.kind === 'add' })),
    ),
  };
}

export type ShownRow = DiffRow | { kind: 'skipped'; count: number };

/** Long runs of lines that did not change are folded into one note, keeping a line or two of context around each change. */
export function collapseSame(rows: DiffRow[], context = 1): ShownRow[] {
  const keep = rows.map((row) => row.kind !== 'same');
  // Read from `changed`, not `keep`, so a line kept as context does not make its own neighbours context too.
  const changed = [...keep];
  changed.forEach((isChange, index) => {
    if (!isChange) return;
    for (let d = 1; d <= context; d += 1) {
      if (index - d >= 0) keep[index - d] = true;
      if (index + d < rows.length) keep[index + d] = true;
    }
  });
  const shown: ShownRow[] = [];
  let skipped = 0;
  rows.forEach((row, index) => {
    if (keep[index]) {
      if (skipped) shown.push({ kind: 'skipped', count: skipped });
      skipped = 0;
      shown.push(row);
    } else skipped += 1;
  });
  if (skipped) shown.push({ kind: 'skipped', count: skipped });
  return shown;
}
