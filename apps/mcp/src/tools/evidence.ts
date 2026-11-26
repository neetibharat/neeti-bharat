import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import {
  EVIDENCE_FILE_EXTENSIONS,
  EVIDENCE_FILE_MAX_BYTES,
  EVIDENCE_FILE_NAME_MAX_LENGTH,
  EVIDENCE_NOTE_MAX_LENGTH,
  EVIDENCE_TITLE_MAX_LENGTH,
  EVIDENCE_URL_MAX_LENGTH,
} from '@neeti-bharat/shared';
import { z } from 'zod';
import { defineTool } from '../tool.js';
import { id } from './fields.js';

const controlId = id('The control id from get_rule');
const proofRequirementId = id(
  'The proof requirement it answers, from list_proof. Leave out for general proof.',
).optional();
const title = z.string().trim().min(1).max(EVIDENCE_TITLE_MAX_LENGTH);

const HANDED_OVER =
  'Attach only what the person gave you. Never write a note that claims something happened that they did not tell you.';

async function readUpload(path: string): Promise<{ blob: Blob; name: string }> {
  const extension = extname(path).slice(1).toLowerCase();
  if (!(EVIDENCE_FILE_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new Error(
      `Files of type .${extension} are not accepted. Allowed: ${EVIDENCE_FILE_EXTENSIONS.join(', ')}.`,
    );
  }
  const { size } = await stat(path);
  if (size > EVIDENCE_FILE_MAX_BYTES) throw new Error('That file is over the 25 MB limit.');
  return {
    blob: new Blob([await readFile(path)]),
    name: basename(path).slice(-EVIDENCE_FILE_NAME_MAX_LENGTH),
  };
}

export const evidenceTools = [
  defineTool({
    name: 'add_evidence_link',
    title: 'Attach a link as proof',
    description: `Attaches a web link as proof on a control. ${HANDED_OVER}`,
    kind: 'change',
    input: {
      controlId,
      title,
      url: z.url({ protocol: /^https?$/ }).max(EVIDENCE_URL_MAX_LENGTH),
      proofRequirementId,
    },
    run: ({ controlId: target, ...body }, api) =>
      api.post(`/controls/${target}/evidence`, { kind: 'link', ...body }),
  }),
  defineTool({
    name: 'add_evidence_note',
    title: 'Attach a note as proof',
    description: `Attaches a written note as proof on a control. ${HANDED_OVER}`,
    kind: 'change',
    input: {
      controlId,
      title,
      note: z.string().trim().min(1).max(EVIDENCE_NOTE_MAX_LENGTH),
      proofRequirementId,
    },
    run: ({ controlId: target, ...body }, api) =>
      api.post(`/controls/${target}/evidence`, { kind: 'note', ...body }),
  }),
  defineTool({
    name: 'add_evidence_file',
    title: 'Attach a file as proof',
    description: `Uploads a file from this computer as proof on a control. Give the full path to the file. Up to 25 MB. ${HANDED_OVER}`,
    kind: 'change',
    input: { controlId, filePath: z.string().min(1), title: title.optional(), proofRequirementId },
    run: async (
      { controlId: target, filePath, title: name, proofRequirementId: requirement },
      api,
    ) => {
      const { blob, name: fileName } = await readUpload(filePath);
      const form = new FormData();
      form.set('file', blob, fileName);
      if (name) form.set('title', name);
      if (requirement) form.set('proofRequirementId', requirement);
      return api.upload(`/controls/${target}/evidence/files`, form);
    },
  }),
  defineTool({
    name: 'remove_evidence',
    title: 'Remove proof',
    description:
      'Removes a piece of proof. Only when the person asks: taking away a control’s last proof sends it back to in progress.',
    kind: 'remove',
    input: { controlId, evidenceId: id('The evidence id') },
    run: (args, api) => api.delete(`/controls/${args.controlId}/evidence/${args.evidenceId}`),
  }),
];
