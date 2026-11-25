import { TEMPLATES_PATH, type EvidenceResponse } from '@dpdp-kit/shared';

// Letters and digits only, so spaces, brackets and underscores added on upload do not matter.
const stemOf = (file: string): string =>
  file
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** The template file a requirement's description names, or null when it names none. */
export function templateFileOf(description: string): string | null {
  const start = description.indexOf(TEMPLATES_PATH);
  if (start === -1) return null;
  const rest = description.slice(start + TEMPLATES_PATH.length);
  return /^[\w.-]+\.[A-Za-z0-9]+/.exec(rest)?.[0].replace(/\.$/, '') ?? null;
}

/** A file saved under the template's name, with anything added after it, such as "_filled" or "_v2". */
export function isFilledTemplate(item: EvidenceResponse, templateFile: string): boolean {
  if (item.kind !== 'file' || !item.fileName) return false;
  return stemOf(item.fileName).startsWith(stemOf(templateFile));
}

/** The filled template first, newest first, and everything else after it in the order given. */
export function splitProof(
  evidence: EvidenceResponse[],
  description: string,
): { filled: EvidenceResponse[]; other: EvidenceResponse[]; templateFile: string | null } {
  const templateFile = templateFileOf(description);
  if (!templateFile) return { filled: [], other: evidence, templateFile };
  return {
    filled: evidence.filter((item) => isFilledTemplate(item, templateFile)),
    other: evidence.filter((item) => !isFilledTemplate(item, templateFile)),
    templateFile,
  };
}
