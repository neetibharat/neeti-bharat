import {
  PROFILE_LABEL_MAX_LENGTH,
  PROFILE_VALUE_MAX_LENGTH,
  type AssigneesResponse,
  type ProfileResponse,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import { defineTool } from '../tool.js';
import { id } from './fields.js';

const key = id('The answer’s key from get_company_answers');
const value = z.string().trim().max(PROFILE_VALUE_MAX_LENGTH);

export const contextTools = [
  defineTool({
    name: 'list_people',
    title: 'List people',
    description:
      'The people work can be given to, with their ids. Use it before assigning a control or proof, and offer the person these names. Never assign someone they have not named.',
    kind: 'read',
    input: {},
    run: (_args, api) => api.get<AssigneesResponse>('/assignees'),
  }),
  defineTool({
    name: 'get_company_answers',
    title: 'Get company answers',
    description:
      'The company’s own facts (name, DPO, contact emails, periods) and any it added. In policy text write one as {{key}} so it stays right when the answer changes. Use only keys from this list. requiresConfirmation marks a legal limit.',
    kind: 'read',
    input: {},
    run: async (_args, api) => {
      const { entries } = await api.get<ProfileResponse>('/profile');
      return entries;
    },
  }),
  defineTool({
    name: 'update_company_answer',
    title: 'Change a company answer',
    description:
      'Changes the value of an answer. Needs an admin key. A legal limit (requiresConfirmation) also needs confirmed: true, which you set only after the person has agreed to change it. An answer taken from the DPO role cannot be changed here (CONFLICT).',
    kind: 'change',
    input: { key, value, confirmed: z.boolean().optional() },
    run: ({ key: target, ...body }, api) => api.put(`/profile/entries/${target}`, body),
  }),
  defineTool({
    name: 'add_company_answer',
    title: 'Add a company answer',
    description:
      'Adds an answer of the company’s own, such as an office address, and replies with its key. Then write {{key}} in policy text. Needs an admin key. The same label twice is a CONFLICT.',
    kind: 'change',
    input: { label: z.string().trim().min(1).max(PROFILE_LABEL_MAX_LENGTH), value },
    run: (args, api) => api.post('/profile/entries', args),
  }),
  defineTool({
    name: 'remove_company_answer',
    title: 'Remove a company answer',
    description:
      'Removes an answer the company added. Only on the person’s say-so, and check that no policy still quotes it. Built-in answers cannot be removed. Needs an admin key.',
    kind: 'remove',
    input: { key },
    run: (args, api) => api.delete(`/profile/entries/${args.key}`),
  }),
];
