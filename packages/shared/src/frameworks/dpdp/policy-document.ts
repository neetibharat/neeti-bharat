import type { ProfileKey } from '../../profile.js';
import type { PolicyTemplate } from './policy-text.js';

/**
 * A policy's text, in the JSON format of the editor (Tiptap, which is ProseMirror). The API stores it and
 * hands it back without looking inside, apart from checking its shape and size.
 */
export interface DocNode {
  type: string;
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
  content?: DocNode[];
}

export interface PolicyDocument {
  type: 'doc';
  content: DocNode[];
}

/** The biggest policy text accepted, as JSON. Far beyond any real policy. */
export const POLICY_DOCUMENT_MAX_BYTES = 200_000;

const TOKEN = /\{\{(\w+)\}\}/g;

/** Short English names for the settings a policy quotes, used when the starting text is written. */
export const SETTING_LABELS: Readonly<Partial<Record<ProfileKey, string>>> = {
  languagesOffered: 'Languages offered',
  website: 'Website',
  grievanceEmail: 'Grievance email',
  leaverAccessWithin: 'Access removed for leavers within',
  accessReview: 'Access is reviewed',
  minTls: 'Minimum TLS version',
  encryptionStandard: 'Encryption standard',
  keyRotation: 'Keys are rotated',
  logKeepPeriod: 'Logs are kept for',
  maxDataLoss: 'Most data we can lose',
  timeToRestore: 'Time to restore service',
  breachReportWindow: 'Breach report window',
  breachContact: 'Breach contact',
  erasureWarning: 'Notice before erasure',
  inactivityErasureAfter: 'Inactive data erased after',
  dpoEmail: 'DPO email',
  dpoName: 'DPO name',
  grievanceReplyTime: 'Grievance reply time',
};

const text = (value: string, marks?: { type: string }[]): DocNode => ({
  type: 'text',
  text: value,
  ...(marks && { marks }),
});
const paragraph = (...content: DocNode[]): DocNode => ({ type: 'paragraph', content });
const heading = (title: string): DocNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [text(title)],
});
const bullets = (items: DocNode[][]): DocNode => ({
  type: 'bulletList',
  content: items.map((content) => ({ type: 'listItem', content: [paragraph(...content)] })),
});

/** The text a policy starts with, before anyone has edited it. Company answers are left as `{{key}}`. */
export function starterDocument(template: PolicyTemplate): PolicyDocument {
  const content: DocNode[] = [
    heading('Purpose'),
    paragraph(text(template.purpose)),
    heading('Scope'),
    paragraph(text(template.scope)),
  ];
  if (template.requirements.length) {
    content.push(
      heading('What it requires'),
      bullets(
        template.requirements.map((r) => [
          text(`${r.title}.`, [{ type: 'bold' }]),
          text(` ${r.description}`),
        ]),
      ),
    );
  }
  if (template.settings.length) {
    content.push(
      heading('Settings'),
      bullets(template.settings.map((key) => [text(`${SETTING_LABELS[key] ?? key}: {{${key}}}`)])),
    );
  }
  content.push(heading('Contact'), paragraph(text(template.contact)));
  return { type: 'doc', content };
}

/** Every company answer a document asks for. */
export function tokenKeys(document: PolicyDocument): ProfileKey[] {
  const keys = new Set<ProfileKey>();
  const visit = (node: DocNode): void => {
    for (const match of node.text?.matchAll(TOKEN) ?? []) keys.add(match[1] as ProfileKey);
    node.content?.forEach(visit);
  };
  document.content.forEach(visit);
  return [...keys];
}

/** One filled-in answer, or its name in square brackets and highlighted while it is not answered yet. */
function answerPiece(
  node: DocNode,
  key: ProfileKey,
  values: Readonly<Record<string, string>>,
  labelOf: (key: ProfileKey) => string,
): DocNode {
  const answer = values[key];
  const marks = [...(node.marks ?? []), ...(answer ? [] : [{ type: 'highlight' }])];
  return { ...node, text: answer || `[${labelOf(key)}]`, ...(marks.length && { marks }) };
}

/** Splits one piece of text around its tokens, filling each with the company's answer. */
function fillText(
  node: DocNode,
  values: Readonly<Record<string, string>>,
  labelOf: (key: ProfileKey) => string,
): DocNode[] {
  const pieces: DocNode[] = [];
  let last = 0;
  const source = node.text ?? '';
  for (const match of source.matchAll(TOKEN)) {
    if (match.index > last) pieces.push({ ...node, text: source.slice(last, match.index) });
    pieces.push(answerPiece(node, match[1] as ProfileKey, values, labelOf));
    last = match.index + match[0].length;
  }
  if (last < source.length) pieces.push({ ...node, text: source.slice(last) });
  return pieces;
}

/**
 * The document as a reader sees it: each `{{key}}` replaced by the company's answer, or by its name in
 * square brackets and highlighted while it is not answered yet.
 */
export function resolveDocument(
  document: PolicyDocument,
  values: Readonly<Record<string, string>>,
  labelOf: (key: ProfileKey) => string,
): PolicyDocument {
  const resolve = (node: DocNode): DocNode[] => {
    if (node.type === 'text') return node.text ? fillText(node, values, labelOf) : [node];
    return [{ ...node, ...(node.content && { content: node.content.flatMap(resolve) }) }];
  };
  return { type: 'doc', content: document.content.flatMap(resolve) };
}
