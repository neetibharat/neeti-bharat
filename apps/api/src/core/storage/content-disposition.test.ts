import { describe, expect, it } from 'vitest';
import { attachmentDisposition } from './content-disposition';

describe('attachmentDisposition', () => {
  it('asks the browser to save the file under its original name', () => {
    expect(attachmentDisposition('report.pdf')).toBe("attachment; filename*=UTF-8''report.pdf");
  });

  it('encodes spaces and non-ASCII letters', () => {
    expect(attachmentDisposition('मेरी file.pdf')).toBe(
      "attachment; filename*=UTF-8''%E0%A4%AE%E0%A5%87%E0%A4%B0%E0%A5%80%20file.pdf",
    );
  });

  it('encodes the characters a header could trip on', () => {
    expect(attachmentDisposition('a\'b(c)*";x.txt')).toBe(
      "attachment; filename*=UTF-8''a%27b%28c%29%2A%22%3Bx.txt",
    );
  });
});
