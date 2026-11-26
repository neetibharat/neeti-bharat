import { describe, expect, it } from 'vitest';
import { EVIDENCE_FILE_MAX_BYTES } from '@neeti-bharat/shared';
import {
  checkEvidenceFile,
  evidenceFileKey,
  extensionOf,
  sanitiseFileName,
  type UploadedFile,
} from './evidence-file';

const bytes = (...parts: (string | number[])[]): Buffer =>
  Buffer.concat(
    parts.map((part) =>
      typeof part === 'string' ? Buffer.from(part, 'latin1') : Buffer.from(part),
    ),
  );

const upload = (originalname: string, buffer: Buffer): UploadedFile => ({
  originalname,
  buffer,
  size: buffer.length,
});

const PDF = bytes('%PDF-1.7\n%âãÏÓ\n1 0 obj');
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'rest');
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF');
const WEBP = bytes('RIFF', [1, 2, 3, 4], 'WEBPVP8 ');
const GIF = bytes('GIF89a', [1, 0, 1, 0]);
const ZIP = bytes('PK\x03\x04', [20, 0], 'entry');
const OFFICE = bytes('PK\x03\x04', [20, 0], '[Content_Types].xml', [0, 0], 'word/document.xml');

describe('checkEvidenceFile: what is accepted', () => {
  const accepted: [string, Buffer, string][] = [
    ['scan.pdf', PDF, 'application/pdf'],
    ['shot.png', PNG, 'image/png'],
    ['photo.jpg', JPEG, 'image/jpeg'],
    ['photo.JPEG', JPEG, 'image/jpeg'],
    ['pic.webp', WEBP, 'image/webp'],
    ['anim.gif', GIF, 'image/gif'],
    ['notes.txt', Buffer.from('Checked on 1 June — ok'), 'text/plain; charset=utf-8'],
    ['log.csv', Buffer.from('a,b\n1,2\n'), 'text/csv; charset=utf-8'],
    [
      'plan.docx',
      OFFICE,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ['data.xlsx', OFFICE, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    [
      'deck.pptx',
      OFFICE,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ['bundle.zip', ZIP, 'application/zip'],
  ];

  it.each(accepted)('accepts a real %s', (name, content, contentType) => {
    const checked = checkEvidenceFile(upload(name, content));
    expect(checked.contentType).toBe(contentType);
    expect(checked.fileName).toBe(name);
  });

  it('works out the SHA-256 of the contents', () => {
    const checked = checkEvidenceFile(upload('a.txt', Buffer.from('abc')));
    expect(checked.sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('checkEvidenceFile: what is refused', () => {
  const refuse = (file: UploadedFile) => {
    try {
      checkEvidenceFile(file);
    } catch (error) {
      return error;
    }
    throw new Error('was accepted');
  };

  it('refuses an executable renamed to .pdf, .png or .txt', () => {
    const exe = bytes('MZ', [0x90, 0, 3, 0, 0, 0], 'This program cannot be run in DOS mode');
    for (const name of ['setup.pdf', 'setup.png', 'setup.jpg', 'setup.docx', 'setup.zip']) {
      expect(refuse(upload(name, exe))).toMatchObject({
        code: 'FILE_TYPE_NOT_ALLOWED',
        status: 415,
      });
    }
    expect(refuse(upload('setup.txt', exe))).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
  });

  it('refuses an executable under its own name', () => {
    expect(refuse(upload('setup.exe', bytes('MZ', [0])))).toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
  });

  it('refuses a name with no extension', () => {
    expect(refuse(upload('README', Buffer.from('hello')))).toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
  });

  it('refuses text that has a NUL byte or is not UTF-8', () => {
    expect(refuse(upload('a.txt', bytes('hello', [0], 'world')))).toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
    expect(refuse(upload('a.csv', bytes([0xff, 0xfe, 0x41])))).toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
  });

  it('refuses a zip under an extension that is not allowed', () => {
    expect(refuse(upload('bundle.rar', ZIP))).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
    expect(refuse(upload('bundle.jar', ZIP))).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
  });

  it('refuses a plain zip posing as an Office file', () => {
    expect(refuse(upload('plan.docx', ZIP))).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
  });

  it('refuses a PNG that claims to be a PDF', () => {
    expect(refuse(upload('x.pdf', PNG))).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
  });

  it('refuses an empty file', () => {
    expect(refuse(upload('empty.pdf', Buffer.alloc(0)))).toMatchObject({
      code: 'FILE_REQUIRED',
      status: 400,
    });
  });

  it('refuses a file over the size limit, even a valid one', () => {
    const big = Buffer.alloc(EVIDENCE_FILE_MAX_BYTES + 1);
    big.write('%PDF-');
    expect(refuse(upload('big.pdf', big))).toMatchObject({ code: 'FILE_TOO_LARGE', status: 413 });
  });

  it('accepts a file of exactly the limit', () => {
    const exact = Buffer.alloc(EVIDENCE_FILE_MAX_BYTES);
    exact.write('%PDF-');
    expect(checkEvidenceFile(upload('exact.pdf', exact)).contentType).toBe('application/pdf');
  });
});

describe('sanitiseFileName', () => {
  it('drops folders, whichever way they are written', () => {
    expect(sanitiseFileName('../../etc/passwd.txt')).toBe('passwd.txt');
    expect(sanitiseFileName('C:\\Users\\me\\report.pdf')).toBe('report.pdf');
  });

  it('removes control and direction-override characters', () => {
    expect(sanitiseFileName('a\u0000b\u0007c\u202e.pdf')).toBe('abc.pdf');
  });

  it('collapses runs of spaces and trims', () => {
    expect(sanitiseFileName('  Q1    audit \t report.pdf ')).toBe('Q1 audit report.pdf');
  });

  it('keeps names in other scripts', () => {
    expect(sanitiseFileName('रिपोर्ट.pdf')).toBe('रिपोर्ट.pdf');
  });

  it('shortens to 120 characters and keeps the extension', () => {
    const name = sanitiseFileName(`${'a'.repeat(300)}.pdf`);
    expect(name).toHaveLength(120);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('leaves a name of exactly 120 characters alone', () => {
    const name = `${'a'.repeat(116)}.pdf`;
    expect(sanitiseFileName(name)).toBe(name);
  });
});

describe('extensionOf', () => {
  it('takes the last extension in lower case', () => {
    expect(extensionOf('a.tar.GZ')).toBe('gz');
    expect(extensionOf('noext')).toBe('');
    expect(extensionOf('.hidden')).toBe('');
  });
});

describe('evidenceFileKey', () => {
  it('builds organizations/<organisation>/evidence/<control>/<id>/<name>', () => {
    expect(evidenceFileKey('o-1', 'DPDP-R6-01', 'u-1', 'scan.pdf')).toBe(
      'organizations/o-1/evidence/DPDP-R6-01/u-1/scan.pdf',
    );
  });

  it('makes the name safe for any provider, so spaces and odd characters never reach the key', () => {
    expect(evidenceFileKey('o', 'c', 'u', 'Q1 audit (final) é.pdf')).toBe(
      'organizations/o/evidence/c/u/Q1-audit-final-.pdf',
    );
  });
});
