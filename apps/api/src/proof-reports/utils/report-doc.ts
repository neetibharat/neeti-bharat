import { EVIDENCE_NOTE_MAX_LENGTH } from '@neeti-bharat/shared';

export interface ReportTable {
  head: string[];
  rows: string[][];
}

export interface ReportSection {
  heading: string;
  paragraphs?: string[];
  table?: ReportTable;
}

/** A report as plain content, which is then drawn as a PDF, or squeezed into a note when files cannot be kept. */
export interface ReportDoc {
  title: string;
  subtitle: string;
  sections: ReportSection[];
}

/** `entra_mfa_enforced` as `Entra mfa enforced`, for a check whose words the web app holds. */
export function humanize(id: string): string {
  const spaced = id.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const dateOf = (date: Date): string => date.toISOString().slice(0, 10);

export const dateTimeOf = (date: Date): string =>
  `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;

/** The report as text that fits a note: headings and paragraphs, and the table rows one to a line, cut to the note's size. */
export function reportText(doc: ReportDoc): string {
  const lines = [doc.title, doc.subtitle];
  for (const section of doc.sections) {
    lines.push('', section.heading, ...(section.paragraphs ?? []));
    for (const row of section.table?.rows ?? []) lines.push(`- ${row.join(' | ')}`);
  }
  return lines.join('\n').slice(0, EVIDENCE_NOTE_MAX_LENGTH);
}
