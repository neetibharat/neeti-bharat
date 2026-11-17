import { strToU8, zipSync } from 'fflate';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

export interface WordParagraph {
  text: string;
  style?: string;
  bullet?: boolean;
}

/** A small Word file with the given paragraphs: enough for the reader, not for Word to open. */
export function docx(paragraphs: WordParagraph[]): Buffer {
  const body = paragraphs
    .map(({ text, style, bullet }) => {
      const props = [
        style ? `<w:pStyle w:val="${style}"/>` : '',
        bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '',
      ].join('');
      return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ''}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    })
    .join('');
  const xml = `<?xml version="1.0"?><w:document ${W}><w:body>${body}</w:body></w:document>`;
  return Buffer.from(
    zipSync({ '[Content_Types].xml': strToU8('<Types/>'), 'word/document.xml': strToU8(xml) }),
  );
}

/** A small PowerPoint file with one slide for each list of lines. */
export function pptx(slides: string[][]): Buffer {
  const files: Record<string, Uint8Array> = { '[Content_Types].xml': strToU8('<Types/>') };
  slides.forEach((lines, index) => {
    const paragraphs = lines.map((line) => `<a:p><a:r><a:t>${line}</a:t></a:r></a:p>`).join('');
    files[`ppt/slides/slide${index + 1}.xml`] = strToU8(
      `<?xml version="1.0"?><p:sld ${A}><p:cSld><p:spTree>${paragraphs}</p:spTree></p:cSld></p:sld>`,
    );
  });
  return Buffer.from(zipSync(files));
}

/** A one-page PDF with a line of text. The reader rebuilds the index of a file written like this. */
export function pdf(line: string): Buffer {
  const stream = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`;
  return Buffer.from(
    [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
      `4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj`,
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
      'trailer<</Root 1 0 R/Size 6>>',
      '%%EOF',
    ].join('\n'),
    'latin1',
  );
}
