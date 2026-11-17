import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { docx, pdf, pptx } from '../../../test/support/office-files';
import { readDocumentText } from './document-text';

const file = (originalname: string, buffer: Buffer) => ({
  originalname,
  buffer,
  size: buffer.length,
});

const LONG =
  'The Privacy lead keeps the register of every transfer of personal data outside India.';

describe('readDocumentText', () => {
  it('reads a Word file, marking headings and list items', async () => {
    const text = await readDocumentText(
      file(
        'p.docx',
        docx([
          { text: 'Cross-Border Transfer Policy', style: 'Title' },
          { text: '1. Purpose', style: 'Heading2' },
          { text: `${LONG} Fish &amp; Chips &lt;ok&gt;` },
          { text: 'Cloud regions', bullet: true },
        ]),
      ),
    );
    expect(text).toBe(
      [
        '# Cross-Border Transfer Policy',
        '## 1. Purpose',
        `${LONG} Fish & Chips <ok>`,
        '- Cloud regions',
      ].join('\n'),
    );
  });

  it('reads a PowerPoint file slide by slide, in slide order', async () => {
    const text = await readDocumentText(
      file('p.pptx', pptx([['First slide', LONG], ['Second slide']])),
    );
    expect(text.indexOf('--- Slide 1 ---')).toBeLessThan(text.indexOf('--- Slide 2 ---'));
    expect(text).toContain(LONG);
    expect(text).toContain('Second slide');
  });

  it('reads the text of a PDF', async () => {
    const text = await readDocumentText(file('p.pdf', pdf(LONG)));
    expect(text).toContain('Privacy lead keeps the register');
  });

  it('refuses a file whose contents are not its extension', async () => {
    const plain = Buffer.from(LONG.repeat(3));
    for (const name of ['p.pdf', 'p.docx', 'p.pptx', 'p.txt', 'p.doc', 'pdf']) {
      await expect(readDocumentText(file(name, plain))).rejects.toMatchObject({
        code: 'FILE_TYPE_NOT_ALLOWED',
      });
    }
  });

  it('says a file with almost no text, such as a scan, cannot be read', async () => {
    await expect(readDocumentText(file('p.docx', docx([{ text: 'Hi' }])))).rejects.toMatchObject({
      code: 'FILE_UNREADABLE',
    });
  });

  it('refuses a file that unpacks to something huge, and one that is not really a zip', async () => {
    const bomb = Buffer.from(
      zipSync({ 'word/document.xml': new Uint8Array(21 * 1024 * 1024) }, { level: 9 }),
    );
    await expect(readDocumentText(file('p.docx', bomb))).rejects.toMatchObject({
      code: 'FILE_UNREADABLE',
    });
    const broken = Buffer.concat([Buffer.from('PK\x03\x04'), Buffer.from('not a zip at all')]);
    await expect(readDocumentText(file('p.docx', broken))).rejects.toMatchObject({
      code: 'FILE_UNREADABLE',
    });
  });

  it('refuses more text than any real policy holds', async () => {
    const paragraphs = Array.from({ length: 900 }, () => ({ text: LONG.repeat(2) }));
    await expect(readDocumentText(file('p.docx', docx(paragraphs)))).rejects.toMatchObject({
      code: 'FILE_TOO_LONG',
    });
  });

  it('ignores parts of the file it was not asked to open', async () => {
    const zip = Buffer.from(
      zipSync({
        'word/document.xml': strToU8(`<w:document><w:p><w:t>${LONG}</w:t></w:p></w:document>`),
        'word/media/huge.bin': new Uint8Array(30 * 1024 * 1024),
      }),
    );
    await expect(readDocumentText(file('p.docx', zip))).resolves.toContain('Privacy lead');
  });
});
