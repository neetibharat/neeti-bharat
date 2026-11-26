import { extractText, getDocumentProxy } from 'unpdf';
import { describe, expect, it } from 'vitest';
import type { ReportDoc } from './report-doc';
import { renderPdf } from './report-pdf';

const doc = (rows: number): ReportDoc => ({
  title: 'Cloud configuration check report',
  subtitle: 'The latest read-only check.',
  sections: [
    {
      heading: 'Production (Azure)',
      paragraphs: ['Checked 2026-03-09 by Asha.'],
      table: {
        head: ['Check', 'Result', 'Detail'],
        rows: Array.from({ length: rows }, (_, i) => [
          `Check ${i}`,
          'Passed',
          `Detail of check ${i}`,
        ]),
      },
    },
  ],
});

async function textOf(pdf: Buffer): Promise<{ pages: number; text: string }> {
  const proxy = await getDocumentProxy(new Uint8Array(pdf));
  const { text, totalPages } = await extractText(proxy, { mergePages: true });
  return { pages: totalPages, text };
}

describe('renderPdf', () => {
  it('makes a PDF that holds the title, the headings and the rows', async () => {
    const pdf = await renderPdf(doc(3), new Date('2026-03-10T09:00:00Z'));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const { text } = await textOf(pdf);
    expect(text).toContain('Cloud configuration check report');
    expect(text).toContain('Production (Azure)');
    expect(text).toContain('Detail of check 2');
    expect(text).toContain('Made by Neeti Bharat on 2026-03-10 09:00 UTC');
  });

  it('carries on to more pages when the rows do not fit on one', async () => {
    const { pages, text } = await textOf(await renderPdf(doc(120), new Date()));
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain('Detail of check 119');
  });
});
