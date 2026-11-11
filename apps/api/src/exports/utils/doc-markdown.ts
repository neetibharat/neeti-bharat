import type { DocNode, PolicyDocument } from '@dpdp-kit/shared';

const MAX_DEPTH = 20;

function marked(node: DocNode): string {
  const text = node.text ?? '';
  if (!text.trim()) return text;
  return (node.marks ?? []).reduce(
    (out, mark) => (mark.type === 'bold' ? `**${out}**` : out),
    text,
  );
}

function inline(nodes: readonly DocNode[] | undefined): string {
  return (nodes ?? []).map((node) => (node.type === 'hardBreak' ? '  \n' : marked(node))).join('');
}

function listItems(node: DocNode, depth: number): string[] {
  const ordered = node.type === 'orderedList';
  return (node.content ?? []).flatMap((item, index) => {
    const marker = ordered ? `${index + 1}.` : '-';
    const [first, ...rest] = item.content ?? [];
    const head = `${'  '.repeat(depth)}${marker} ${inline(first?.content)}`;
    return [head, ...rest.flatMap((child) => block(child, depth + 1))];
  });
}

const headingLevel = (node: DocNode): number =>
  Math.min(Math.max(Number(node.attrs?.level ?? 2), 1), 6);

function block(node: DocNode, depth = 0): string[] {
  if (depth > MAX_DEPTH) return [];
  switch (node.type) {
    case 'heading':
      return [`${'#'.repeat(headingLevel(node))} ${inline(node.content)}`, ''];
    case 'bulletList':
    case 'orderedList':
      return [...listItems(node, depth), ''];
    case 'paragraph':
      return [inline(node.content), ''];
    default:
      return (node.content ?? []).flatMap((child) => block(child, depth + 1));
  }
}

/** A policy's text as Markdown, so it opens anywhere without the editor. */
export function documentToMarkdown(document: PolicyDocument): string {
  const lines = document.content.flatMap((node) => block(node));
  return `${lines.join('\n').trim()}\n`;
}
