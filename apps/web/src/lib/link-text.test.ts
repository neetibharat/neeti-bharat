import { describe, expect, it } from 'vitest';
import { splitLinks } from './link-text';

describe('splitLinks', () => {
  it('leaves text without an address as one plain part', () => {
    expect(splitLinks('Collect the signed letter.')).toEqual([
      { text: 'Collect the signed letter.' },
    ]);
  });

  it('turns a web address into a link between the plain text around it', () => {
    expect(splitLinks('Use the template at https://docs.example.com/t/1 and fill it in.')).toEqual([
      { text: 'Use the template at ' },
      { text: 'https://docs.example.com/t/1', href: 'https://docs.example.com/t/1' },
      { text: ' and fill it in.' },
    ]);
  });

  it('keeps the full stop or bracket after an address out of the link', () => {
    const [, link, rest] = splitLinks('See (https://x.in/a?b=1).');
    expect(link).toEqual({ text: 'https://x.in/a?b=1', href: 'https://x.in/a?b=1' });
    expect(rest).toEqual({ text: ').' });
  });

  it('finds several addresses, and ignores other kinds', () => {
    const parts = splitLinks('A https://a.in B http://b.in javascript:alert(1) ftp://c.in');
    expect(parts.filter((part) => part.href).map((part) => part.href)).toEqual([
      'https://a.in',
      'http://b.in',
    ]);
  });
});
