import { describe, expect, it } from 'vitest';
import { checkLogoFile, logoFileKey } from './logo-file';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([1, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
]);

const upload = (originalname: string, buffer: Buffer) => ({
  originalname,
  buffer,
  size: buffer.length,
});

describe('checkLogoFile', () => {
  it.each([
    ['logo.png', PNG, 'image/png'],
    ['logo.JPG', JPG, 'image/jpeg'],
    ['logo.jpeg', JPG, 'image/jpeg'],
    ['logo.webp', WEBP, 'image/webp'],
  ])('accepts %s and sets its type from the extension', (name, buffer, type) => {
    const checked = checkLogoFile(upload(name, buffer));
    expect(checked.contentType).toBe(type);
    expect(checked.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses a picture whose contents are not what its name says', () => {
    expect(() => checkLogoFile(upload('logo.png', JPG))).toThrow(
      expect.objectContaining({ code: 'FILE_TYPE_NOT_ALLOWED' }),
    );
    expect(() => checkLogoFile(upload('logo.webp', PNG))).toThrow(
      expect.objectContaining({ code: 'FILE_TYPE_NOT_ALLOWED' }),
    );
  });

  it('refuses types that are not pictures we accept, an SVG included', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    for (const name of ['logo.svg', 'logo.gif', 'logo.pdf', 'logo']) {
      expect(() => checkLogoFile(upload(name, svg))).toThrow(
        expect.objectContaining({ code: 'FILE_TYPE_NOT_ALLOWED' }),
      );
    }
  });

  it('refuses an empty file and one over 2 MB', () => {
    expect(() => checkLogoFile(upload('logo.png', Buffer.alloc(0)))).toThrow(
      expect.objectContaining({ code: 'FILE_REQUIRED' }),
    );
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    expect(() => checkLogoFile(upload('logo.png', big))).toThrow(
      expect.objectContaining({ code: 'FILE_TOO_LARGE' }),
    );
  });

  it('cleans a name that carries a path', () => {
    expect(checkLogoFile(upload('..\\evil/logo.png', PNG)).fileName).toBe('logo.png');
  });
});

describe('logoFileKey', () => {
  it('keeps the id apart and the name safe', () => {
    expect(logoFileKey('o1', 'abc', 'My logo (1).png')).toBe(
      'organizations/o1/logo/abc/My-logo-1-.png',
    );
  });
});
