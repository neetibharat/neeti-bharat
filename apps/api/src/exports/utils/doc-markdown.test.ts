import type { PolicyDocument } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { documentToMarkdown } from './doc-markdown';

const text = (value: string, bold = false) => ({
  type: 'text',
  text: value,
  ...(bold && { marks: [{ type: 'bold' }] }),
});
const item = (value: string) => ({
  type: 'listItem',
  content: [{ type: 'paragraph', content: [text(value)] }],
});

describe('documentToMarkdown', () => {
  it('writes headings, paragraphs, bold text and lists', () => {
    const document: PolicyDocument = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [text('Scope')] },
        { type: 'paragraph', content: [text('We '), text('protect', true), text(' data.')] },
        { type: 'bulletList', content: [item('one'), item('two')] },
        { type: 'orderedList', content: [item('first')] },
      ],
    };
    expect(documentToMarkdown(document)).toBe(
      '## Scope\n\nWe **protect** data.\n\n- one\n- two\n\n1. first\n',
    );
  });

  it('nests a list inside a list item', () => {
    const inner = { type: 'bulletList', content: [item('child')] };
    const document: PolicyDocument = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [text('parent')] }, inner],
            },
          ],
        },
      ],
    };
    expect(documentToMarkdown(document)).toBe('- parent\n  - child\n');
  });

  it('keeps the text of a node it does not know', () => {
    const document: PolicyDocument = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [{ type: 'paragraph', content: [text('quoted')] }] },
      ],
    };
    expect(documentToMarkdown(document)).toBe('quoted\n');
  });
});
