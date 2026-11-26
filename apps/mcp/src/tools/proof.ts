import {
  PROOF_DESCRIPTION_MAX_LENGTH,
  PROOF_FREQUENCIES,
  PROOF_TABS,
  PROOF_TITLE_MAX_LENGTH,
  type ProofOverviewResponse,
  type ProofRequirementDetailResponse,
  type SaveProofRequirementRequest,
} from '@neeti-bharat/shared';
import { z } from 'zod';
import { defineTool } from '../tool.js';
import { dateText, defined, id, personId } from './fields.js';

const controlId = id('The control id from get_rule');
const requirementId = id('The proof requirement id from list_proof');

const title = z.string().trim().min(1).max(PROOF_TITLE_MAX_LENGTH);
const description = z
  .string()
  .trim()
  .max(PROOF_DESCRIPTION_MAX_LENGTH)
  .describe('What to collect. May be empty.');
const frequency = z
  .enum(PROOF_FREQUENCIES)
  .describe('How often proof has to be given again. Older proof stops counting.');
const assigneeId = personId
  .nullable()
  .describe('A person’s id from list_people, or null for the control’s owner');
const dueDate = dateText.nullable().describe('When the first proof is due as YYYY-MM-DD, or null');

export const proofTools = [
  defineTool({
    name: 'list_proof',
    title: 'List what needs proof',
    description:
      'What the company must be able to show, with its status. Narrow it to one control with controlId. Use it to find the id of a proof requirement you just added.',
    kind: 'read',
    input: {
      controlId: controlId.optional(),
      ruleId: id('Only this rule').optional(),
      assigneeId: personId.optional(),
      tab: z.enum(PROOF_TABS).optional(),
      q: z.string().max(100).optional().describe('Search by title'),
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    },
    run: (args, api) => api.get<ProofOverviewResponse>('/proof', args),
  }),
  defineTool({
    name: 'get_proof_requirement',
    title: 'Get a proof requirement',
    description: 'One proof requirement with the evidence given for it and the control it is for.',
    kind: 'read',
    input: { requirementId },
    run: (args, api) => api.get<ProofRequirementDetailResponse>(`/proof/${args.requirementId}`),
  }),
  defineTool({
    name: 'list_control_evidence',
    title: 'List a control’s loose proof',
    description:
      'Archived proof requirements of a control, and proof attached to the control that is not for any one requirement.',
    kind: 'read',
    input: { controlId },
    run: (args, api) => api.get(`/controls/${args.controlId}/evidence`),
  }),
  defineTool({
    name: 'create_proof_requirement',
    title: 'Add a proof requirement',
    description:
      'Adds something a control needs proof of, such as “Annual access review”. Look up the id afterwards with list_proof.',
    kind: 'change',
    input: {
      controlId,
      title,
      description: description.default(''),
      frequency,
      assigneeId: assigneeId.default(null),
      dueDate: dueDate.default(null),
    },
    run: ({ controlId: target, ...body }, api) =>
      api.post(`/controls/${target}/proof-requirements`, body),
  }),
  defineTool({
    name: 'update_proof_requirement',
    title: 'Change a proof requirement',
    description: 'Changes a proof requirement. Send only what changes.',
    kind: 'change',
    input: {
      requirementId,
      title: title.optional(),
      description: description.optional(),
      frequency: frequency.optional(),
      assigneeId: assigneeId.optional(),
      dueDate: dueDate.optional(),
    },
    run: async ({ requirementId: target, ...changes }, api) => {
      const { requirement } = await api.get<ProofRequirementDetailResponse>(`/proof/${target}`);
      const current: SaveProofRequirementRequest = {
        title: requirement.title,
        description: requirement.description,
        frequency: requirement.frequency,
        assigneeId: requirement.assigneeId,
        dueDate: requirement.dueDate,
      };
      return api.put(`/proof-requirements/${target}`, { ...current, ...defined(changes) });
    },
  }),
  defineTool({
    name: 'archive_proof_requirement',
    title: 'Archive a proof requirement',
    description:
      'Archives a proof requirement. Only on the person’s say-so. Proof given for it stays on the control as general proof.',
    kind: 'remove',
    input: { requirementId },
    run: (args, api) => api.delete(`/proof-requirements/${args.requirementId}`),
  }),
  defineTool({
    name: 'restore_proof_requirement',
    title: 'Restore a proof requirement',
    description: 'Brings an archived proof requirement back.',
    kind: 'change',
    input: { requirementId },
    run: (args, api) => api.post(`/proof-requirements/${args.requirementId}/restore`),
  }),
];
