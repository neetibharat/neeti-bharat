import { HttpStatus } from '@nestjs/common';
import { POLICY_IMPORT_MAX_CHARACTERS, type PolicyImportExtension } from '@dpdp-kit/shared';
import { strFromU8, unzipSync } from 'fflate';
import { extractText, getDocumentProxy } from 'unpdf';
import { AppException } from '../../core/common/app.exception';
import type { UploadedFile } from '../../frameworks/utils/evidence-file';

/** The least text a real policy has. Less means a scan or a picture, which holds no text to read. */
const MIN_CHARACTERS = 50;

/** The biggest part of an Office file opened, once unpacked. A real policy is far smaller; a zip bomb is not. */
const MAX_UNPACKED_BYTES = 20 * 1024 * 1024;

const MAX_PDF_PAGES = 200;

const startsWith = (file: Buffer, signature: string): boolean =>
  file.subarray(0, signature.length).toString('latin1') === signature;

/** The type of a file, from its name and then its first bytes, so a renamed file is not taken for another type. */
export function importTypeOf(file: UploadedFile): PolicyImportExtension {
  const dot = file.originalname.lastIndexOf('.');
  const extension = dot < 0 ? '' : file.originalname.slice(dot + 1).toLowerCase();
  const isZip = startsWith(file.buffer, 'PK\x03\x04');
  if (extension === 'pdf' && startsWith(file.buffer, '%PDF-')) return 'pdf';
  if (extension === 'docx' && isZip) return 'docx';
  if (extension === 'pptx' && isZip) return 'pptx';
  throw new AppException('FILE_TYPE_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
}

/** The text of a PDF, Word or PowerPoint file, with headings and list items marked the way a person would write them. */
export async function readDocumentText(file: UploadedFile): Promise<string> {
  const type = importTypeOf(file);
  const text = await READERS[type](file.buffer).catch(() => {
    throw new AppException('FILE_UNREADABLE', HttpStatus.UNPROCESSABLE_ENTITY);
  });
  const clean = text.replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length < MIN_CHARACTERS) {
    throw new AppException('FILE_UNREADABLE', HttpStatus.UNPROCESSABLE_ENTITY);
  }
  if (clean.length > POLICY_IMPORT_MAX_CHARACTERS) {
    throw new AppException('FILE_TOO_LONG', HttpStatus.UNPROCESSABLE_ENTITY);
  }
  return clean;
}

const READERS: Record<PolicyImportExtension, (file: Buffer) => Promise<string>> = {
  pdf: readPdf,
  docx: async (file) => readDocx(file),
  pptx: async (file) => readPptx(file),
};

async function readPdf(file: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(file));
  if (pdf.numPages > MAX_PDF_PAGES) throw new Error('Too many pages');
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** Opens only the named parts of an Office file, and refuses one that would unpack to something huge. */
function unpack(file: Buffer, wanted: (name: string) => boolean): Record<string, Uint8Array> {
  return unzipSync(new Uint8Array(file), {
    filter: (entry) => {
      if (!wanted(entry.name)) return false;
      if (entry.originalSize > MAX_UNPACKED_BYTES) throw new Error('Part is too large');
      return true;
    },
  });
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, name: string) => {
    if (name.startsWith('#')) {
      const code =
        name[1]?.toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isInteger(code) && code > 0 && code < 0x110000
        ? String.fromCodePoint(code)
        : '';
    }
    return ENTITIES[name] ?? whole;
  });
}

/** The words in one run of paragraph XML: every text element, with tabs and line breaks kept. */
function runsText(paragraph: string, textTag: string): string {
  const parts = paragraph.matchAll(
    new RegExp(`<${textTag}(?:\\s[^>]*)?>([^<]*)</${textTag}>|<(w:tab|w:br|a:br)\\s*/>`, 'g'),
  );
  return [...parts]
    .map((part) => (part[1] !== undefined ? decode(part[1]) : part[2] === 'w:tab' ? '\t' : '\n'))
    .join('');
}

const paragraphsOf = (xml: string, tag: string): string[] =>
  [...xml.matchAll(new RegExp(`<${tag}[ >][\\s\\S]*?</${tag}>`, 'g'))].map((match) => match[0]);

function wordParagraph(paragraph: string): string {
  const text = runsText(paragraph, 'w:t').trim();
  if (!text) return '';
  const style = /<w:pStyle w:val="([^"]+)"/.exec(paragraph)?.[1] ?? '';
  const level = /^(?:Heading|Title)\s*(\d?)/i.exec(style);
  if (level) return `${'#'.repeat(Number(level[1]) || 1)} ${text}`;
  return paragraph.includes('<w:numPr>') ? `- ${text}` : text;
}

function readDocx(file: Buffer): string {
  const parts = unpack(file, (name) => name === 'word/document.xml');
  const xml = strFromU8(parts['word/document.xml'] ?? new Uint8Array());
  return paragraphsOf(xml, 'w:p').map(wordParagraph).filter(Boolean).join('\n');
}

const slideNumber = (name: string): number => Number(/slide(\d+)\.xml$/.exec(name)?.[1] ?? 0);

function readPptx(file: Buffer): string {
  const parts = unpack(file, (name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  return Object.keys(parts)
    .sort((a, b) => slideNumber(a) - slideNumber(b))
    .map((name) => {
      const lines = paragraphsOf(strFromU8(parts[name] ?? new Uint8Array()), 'a:p')
        .map((paragraph) => runsText(paragraph, 'a:t').trim())
        .filter(Boolean);
      return [`--- Slide ${slideNumber(name)} ---`, ...lines].join('\n');
    })
    .join('\n\n');
}
