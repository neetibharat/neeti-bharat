import type { AssigneesResponse, ProfileResponse } from '@dpdp-kit/shared';
import { defineTool } from '../tool.js';

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
      'The company’s own facts (name, DPO, contact emails, periods). In policy text write one as {{key}} so it stays right when the answer changes. Use only keys from this list.',
    kind: 'read',
    input: {},
    run: async (_args, api) => {
      const { entries } = await api.get<ProfileResponse>('/profile');
      return entries;
    },
  }),
];
