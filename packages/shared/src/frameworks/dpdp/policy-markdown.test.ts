import { describe, expect, it } from 'vitest';
import type { DocNode, PolicyDocument } from './policy-document.js';
import { documentToMarkdown, markdownToDocument } from './policy-markdown.js';

// The API refuses a text node with no text.
function policyDocumentIsValid(document: PolicyDocument): boolean {
  const ok = (node: DocNode): boolean =>
    node.type === 'text' ? Boolean(node.text) : (node.content ?? []).every(ok);
  return document.content.every(ok);
}

describe('markdownToDocument', () => {
  it('turns sections, paragraphs and lists into editor nodes', () => {
    const document = markdownToDocument(
      '## Purpose\n\nShare data with {{companyName}} vendors.\n\n- A contract first.\n- Then a review.\n\n1. One\n2. Two',
    );
    expect(document.content.map((node) => node.type)).toEqual([
      'heading',
      'paragraph',
      'bulletList',
      'orderedList',
    ]);
    expect(document.content[1]?.content?.[0]?.text).toBe(
      'Share data with {{companyName}} vendors.',
    );
    expect(document.content[2]?.content).toHaveLength(2);
  });

  it('turns bold and italic into marks and never leaves a raw asterisk', () => {
    const [paragraph] = markdownToDocument('A **firm** and *soft* rule.').content;
    expect(paragraph?.content).toEqual([
      { type: 'text', text: 'A ' },
      { type: 'text', text: 'firm', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' and ' },
      { type: 'text', text: 'soft', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' rule.' },
    ]);
  });

  it('keeps level 2 for titles and sections and level 3 below them', () => {
    const levels = markdownToDocument('# A\n## B\n### C\n#### D').content.map(
      (n) => n.attrs?.['level'],
    );
    expect(levels).toEqual([2, 2, 3, 3]);
  });

  it('joins the lines of one paragraph and starts a new one at a blank line', () => {
    const { content } = markdownToDocument('first line\nsecond line\n\nnext');
    expect(content).toHaveLength(2);
    expect(content[0]?.content?.[0]?.text).toBe('first line second line');
  });

  it('gives an empty document for empty text and never an empty text node', () => {
    expect(markdownToDocument('  \n\n').content).toEqual([]);
    expect(policyDocumentIsValid(markdownToDocument('## A\n\n****\n\n- x'))).toBe(true);
  });
});

describe('documentToMarkdown', () => {
  it('reads back what was written', () => {
    const markdown =
      '## Purpose\n\nA **firm** rule.\n\n- One\n- Two\n\n1. First\n2. Second\n\n> Quoted';
    expect(documentToMarkdown(markdownToDocument(markdown))).toBe(markdown);
  });
});
