import PDFDocument from 'pdfkit';
import { dateTimeOf, type ReportDoc, type ReportSection, type ReportTable } from './report-doc';

const MARGIN = 50;
const PAGE_BOTTOM = 790;
const ROW_PADDING = 4;
const INK = '#1a1a1a';
const MUTED = '#666666';
const LINE = '#d0d0d0';

type Pdf = InstanceType<typeof PDFDocument>;

const contentWidth = (pdf: Pdf): number => pdf.page.width - MARGIN * 2;

/** The widths of the columns: the first two are narrow, and the last takes what is left. */
function columnWidths(table: ReportTable, width: number): number[] {
  const count = table.head.length;
  if (count === 1) return [width];
  const narrow = Math.min(150, width / count);
  return table.head.map((_, index) =>
    index === count - 1 ? width - narrow * (count - 1) : narrow,
  );
}

function rowHeight(pdf: Pdf, cells: string[], widths: number[]): number {
  const heights = cells.map((cell, i) => pdf.heightOfString(cell, { width: widths[i]! - 8 }));
  return Math.max(...heights) + ROW_PADDING * 2;
}

function drawRow(pdf: Pdf, cells: string[], widths: number[], bold: boolean): void {
  const height = rowHeight(pdf, cells, widths);
  if (pdf.y + height > PAGE_BOTTOM) pdf.addPage();
  const top = pdf.y;
  let left = MARGIN;
  pdf
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(9)
    .fillColor(INK);
  cells.forEach((cell, i) => {
    pdf.text(cell, left + 4, top + ROW_PADDING, { width: widths[i]! - 8 });
    left += widths[i]!;
  });
  pdf
    .moveTo(MARGIN, top + height)
    .lineTo(MARGIN + widths.reduce((sum, w) => sum + w, 0), top + height)
    .strokeColor(LINE)
    .stroke();
  pdf.x = MARGIN;
  pdf.y = top + height;
}

function drawTable(pdf: Pdf, table: ReportTable): void {
  const widths = columnWidths(table, contentWidth(pdf));
  drawRow(pdf, table.head, widths, true);
  for (const row of table.rows) drawRow(pdf, row, widths, false);
}

function drawSection(pdf: Pdf, section: ReportSection): void {
  if (pdf.y + 80 > PAGE_BOTTOM) pdf.addPage();
  pdf.moveDown(1).font('Helvetica-Bold').fontSize(13).fillColor(INK).text(section.heading);
  pdf.moveDown(0.4).font('Helvetica').fontSize(10).fillColor(INK);
  for (const paragraph of section.paragraphs ?? []) pdf.text(paragraph).moveDown(0.4);
  if (section.table) drawTable(pdf, section.table);
}

/** Draws the report as a PDF, A4, with the kit's name and when it was made in the footer of the last line. */
export function renderPdf(doc: ReportDoc, madeAt: Date): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: { Title: doc.title, Creator: 'DPDP Kit', Producer: 'DPDP Kit' },
    });
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    pdf.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(doc.title);
    pdf.moveDown(0.3).font('Helvetica').fontSize(10).fillColor(MUTED).text(doc.subtitle);
    for (const section of doc.sections) drawSection(pdf, section);
    pdf.moveDown(2).fontSize(8).fillColor(MUTED);
    pdf.text(
      `Made by DPDP Kit on ${dateTimeOf(madeAt)}. Read from the records the kit holds; nothing was changed.`,
    );
    pdf.end();
  });
}
