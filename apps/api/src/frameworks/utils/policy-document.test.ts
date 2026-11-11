import { describe, expect, it } from 'vitest';
import { policyDocumentSchema, toPolicyDocument } from './policy-document';

const doc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hi', marks: [{ type: 'link', attrs: { href: 'https://a.in' } }] },
      ],
    },
  ],
};

describe('toPolicyDocument', () => {
  it('returns a stored document as it is, keeping what the editor added', () => {
    expect(toPolicyDocument(doc)).toEqual(doc);
  });

  it.each([
    null,
    'text',
    { type: 'doc' },
    { type: 'page', content: [] },
    { type: 'doc', content: [{}] },
  ])('refuses %j', (json) => {
    expect(() => toPolicyDocument(json)).toThrow('not a valid document');
  });
});

describe('policyDocumentSchema', () => {
  it('refuses text bigger than any real policy', () => {
    const big = {
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { x: 'y'.repeat(300_000) } }],
    };
    expect(policyDocumentSchema.safeParse(big).success).toBe(false);
  });
});
