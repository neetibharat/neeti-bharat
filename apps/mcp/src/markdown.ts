import type { DocNode, PolicyDocument } from '@dpdp-kit/shared';

type Mark = { type: 'bold' | 'italic' };

const text = (value: string, marks?: Mark[]): DocNode => ({
  type: 'text',
  text: value,
  ...(marks && marks.length > 0 && { marks }),
});

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*/g;

/** Splits a line into text nodes, with `**bold**` and `*italic*` as marks. Empty text is never produced. */
function inline(line: string): DocNode[] {
  const nodes: DocNode[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE)) {
    if (match.index > last) nodes.push(text(line.slice(last, match.index)));
    const bold = match[1];
    nodes.push(
      bold === undefined
        ? text(match[2] ?? '', [{ type: 'italic' }])
        : text(bold, [{ type: 'bold' }]),
    );
    last = match.index + match[0].length;
  }
  if (last < line.length) nodes.push(text(line.slice(last)));
  return nodes;
}

const paragraph = (value: string): DocNode => ({ type: 'paragraph', content: inline(value) });
const listItem = (value: string): DocNode => ({ type: 'listItem', content: [paragraph(value)] });

const HEADING = /^(#{1,6})\s+(.+)$/;
const BULLET = /^[-*+]\s+(.+)$/;
const NUMBERED = /^\d+[.)]\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;

/** A line's kind, so a run of the same kind can be grouped into one block. */
function kindOf(line: string): 'heading' | 'bullet' | 'numbered' | 'quote' | 'text' {
  if (HEADING.test(line)) return 'heading';
  if (BULLET.test(line)) return 'bullet';
  if (NUMBERED.test(line)) return 'numbered';
  return QUOTE.test(line) ? 'quote' : 'text';
}

const strip = (line: string, pattern: RegExp): string => pattern.exec(line)?.[1]?.trim() ?? '';

function headingNode(line: string): DocNode {
  const hashes = HEADING.exec(line)?.[1] ?? '##';
  // Level 2 for a title or a section and 3 for anything under it: the editor offers no others.
  return {
    type: 'heading',
    attrs: { level: hashes.length >= 3 ? 3 : 2 },
    content: inline((HEADING.exec(line)?.[2] ?? '').trim().replace(/^\*\*(.+)\*\*$/, '$1')),
  };
}

function block(kind: ReturnType<typeof kindOf>, lines: string[]): DocNode | null {
  if (kind === 'bullet')
    return { type: 'bulletList', content: lines.map((l) => listItem(strip(l, BULLET))) };
  if (kind === 'numbered') {
    return { type: 'orderedList', content: lines.map((l) => listItem(strip(l, NUMBERED))) };
  }
  if (kind === 'quote')
    return {
      type: 'blockquote',
      content: [paragraph(lines.map((l) => strip(l, QUOTE)).join(' '))],
    };
  const joined = lines.join(' ').trim();
  return joined === '' ? null : paragraph(joined);
}

/**
 * Turns Markdown into the editor's document. Headings, paragraphs, bullet and numbered lists, quotes, bold and
 * italic are understood; anything else stays as plain text. Company answers such as `{{companyName}}` are kept.
 */
export function markdownToDocument(markdown: string): PolicyDocument {
  const content: DocNode[] = [];
  let run: string[] = [];
  let runKind: ReturnType<typeof kindOf> = 'text';

  const flush = () => {
    const node = run.length > 0 ? block(runKind, run) : null;
    if (node) content.push(node);
    run = [];
  };

  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const kind = kindOf(line);
    if (line === '' || kind === 'heading' || kind !== runKind) flush();
    if (line === '') continue;
    if (kind === 'heading') content.push(headingNode(line));
    else run.push(line);
    runKind = kind;
  }
  flush();
  return { type: 'doc', content };
}

function marked(node: DocNode): string {
  const value = node.text ?? '';
  const types = new Set((node.marks ?? []).map((mark) => mark.type));
  const bold = types.has('bold') ? `**${value}**` : value;
  return types.has('italic') ? `*${bold}*` : bold;
}

const inlineText = (node: DocNode): string =>
  node.type === 'text' ? marked(node) : (node.content ?? []).map(inlineText).join('');

const itemText = (item: DocNode): string => (item.content ?? []).map(inlineText).join(' ');

function blockToMarkdown(node: DocNode): string {
  const items = node.content ?? [];
  switch (node.type) {
    case 'heading':
      return `${'#'.repeat(Number(node.attrs?.['level'] ?? 2))} ${inlineText(node)}`;
    case 'bulletList':
      return items.map((item) => `- ${itemText(item)}`).join('\n');
    case 'orderedList':
      return items.map((item, index) => `${index + 1}. ${itemText(item)}`).join('\n');
    case 'blockquote':
      return `> ${itemText(node)}`;
    default:
      return inlineText(node);
  }
}

/** The policy text as Markdown, which is far shorter for Claude to read than the editor's JSON. */
export function documentToMarkdown(document: PolicyDocument): string {
  return document.content.map(blockToMarkdown).join('\n\n');
}
