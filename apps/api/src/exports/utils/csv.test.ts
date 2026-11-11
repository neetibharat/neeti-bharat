import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('starts with a byte order mark and ends lines with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe('﻿a,b\r\n1,2\r\n');
  });

  it('quotes cells with commas, quotes and line breaks', () => {
    const csv = toCsv(['x'], [['a,b'], ['say "hi"'], ['two\nlines']]);
    expect(csv).toBe('﻿x\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"\r\n');
  });

  it('leaves empty cells empty and writes numbers and booleans as they are', () => {
    expect(toCsv(['a', 'b', 'c', 'd'], [[null, undefined, 42, true]])).toBe(
      '﻿a,b,c,d\r\n,,42,true\r\n',
    );
  });

  it('turns a cell that would run as a formula into plain text', () => {
    const csv = toCsv(['x'], [['=1+1'], ['+91'], ['-5 days'], ['@sum'], ['fine']]);
    expect(csv).toBe("﻿x\r\n'=1+1\r\n'+91\r\n'-5 days\r\n'@sum\r\nfine\r\n");
  });

  it('does not touch real negative numbers', () => {
    expect(toCsv(['x'], [[-3]])).toBe('﻿x\r\n-3\r\n');
  });
});
