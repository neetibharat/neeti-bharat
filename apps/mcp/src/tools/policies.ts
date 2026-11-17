import {
  POLICY_APPROVER_TITLE_MAX_LENGTH,
  POLICY_DOCUMENT_MAX_BYTES,
  POLICY_SUMMARY_MAX_LENGTH,
  POLICY_TITLE_MAX_LENGTH,
  CHANGELOG_MAX_LENGTH,
  documentToMarkdown,
  markdownToDocument,
  type PolicyDetailResponse,
  type PolicyListResponse,
  type PolicyVersionResponse,
  type SavePolicyRequest,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import { defineTool } from '../tool.js';
import { defined, id, jobRole, personId } from './fields.js';

const policyId = id('The policy id from list_policies');
const title = z.string().trim().min(1).max(POLICY_TITLE_MAX_LENGTH);
const summary = z
  .string()
  .trim()
  .min(1)
  .max(POLICY_SUMMARY_MAX_LENGTH)
  .describe('What the policy is for');
const approverTitle = z
  .string()
  .trim()
  .min(1)
  .max(POLICY_APPROVER_TITLE_MAX_LENGTH)
  .describe('A plain title such as General Counsel. Used until a person is named.');

const brief = (policy: PolicyListResponse['policies'][number]) => ({
  id: policy.id,
  title: policy.title,
  status: policy.status,
  ownerRole: policy.ownerRole,
  approver: policy.approver,
  isCustom: policy.isCustom,
  controlCount: policy.controlCount,
});

export const policyTools = [
  defineTool({
    name: 'list_policies',
    title: 'List policies',
    description:
      'Every policy with where it stands (draft, in_review, approved). Check it before adding one so you do not duplicate. Set archived to see the archived ones.',
    kind: 'read',
    input: { archived: z.boolean().default(false) },
    run: async (args, api) => {
      const { policies } = await api.get<PolicyListResponse>(
        args.archived ? '/policies/archived' : '/policies',
      );
      return policies.map(brief);
    },
  }),
  defineTool({
    name: 'get_policy',
    title: 'Get a policy',
    description:
      'One policy with its text as Markdown, its status, owner, approver, approval history and whether you may decide it (canDecide). Only a draft can have its text changed.',
    kind: 'read',
    input: { policyId },
    run: async (args, api) => {
      const { content, ...policy } = await api.get<PolicyDetailResponse>(
        `/policies/${args.policyId}`,
      );
      return { ...policy, text: documentToMarkdown(content) };
    },
  }),
  defineTool({
    name: 'get_policy_coverage',
    title: 'Controls a policy covers',
    description: 'Every control a policy covers, across all frameworks.',
    kind: 'read',
    input: { policyId },
    run: (args, api) => api.get(`/policies/${args.policyId}/coverage`),
  }),
  defineTool({
    name: 'create_policy',
    title: 'Add a policy',
    description:
      'Adds a policy as a draft. Replies with it, including its id. Then write its text with write_policy_text and link it to controls with add_policies_to_control.',
    kind: 'change',
    input: {
      frameworkId: id(
        'The framework it sits under, from list_frameworks. It can still cover controls in any framework.',
      ),
      title,
      summary,
      ownerRole: jobRole,
      approverTitle,
    },
    run: (args, api) => api.post('/policies', args),
  }),
  defineTool({
    name: 'update_policy_details',
    title: 'Change a policy’s details',
    description:
      'Changes a policy’s title, summary, owner job or approver title. Send only what changes.',
    kind: 'change',
    input: {
      policyId,
      title: title.optional(),
      summary: summary.optional(),
      ownerRole: jobRole.optional(),
      approverTitle: approverTitle.optional(),
    },
    run: async ({ policyId: target, ...changes }, api) => {
      const current = await api.get<PolicyDetailResponse>(`/policies/${target}`);
      const details: SavePolicyRequest = {
        title: current.title,
        summary: current.summary,
        ownerRole: current.ownerRole,
        approverTitle: current.approver,
      };
      return api.put(`/policies/${target}/details`, { ...details, ...defined(changes) });
    },
  }),
  defineTool({
    name: 'write_policy_text',
    title: 'Write a policy’s text',
    description: `Replaces a draft policy's text. Write Markdown: ## for sections, - for bullets, 1. for numbered lists, > for quotes, **bold** and *italic*. Usual sections: Purpose, Scope, What it requires, Responsibilities, Exceptions, Contact. Write company facts as {{key}} using keys from get_company_answers, never the value itself. The text must stay under ${POLICY_DOCUMENT_MAX_BYTES} bytes. Only a draft can be written (otherwise CONFLICT): use reopen_policy or send_policy_back first.`,
    kind: 'change',
    input: { policyId, markdown: z.string().min(1) },
    run: async (args, api) => {
      await api.put(`/policies/${args.policyId}/content`, {
        content: markdownToDocument(args.markdown),
      });
      return { saved: true };
    },
  }),
  defineTool({
    name: 'request_policy_review',
    title: 'Send a policy for review',
    description:
      'Sends a draft policy to its approver. Only after the person says so. changelog says what changed, and the approver reads it.',
    kind: 'change',
    input: { policyId, changelog: z.string().trim().max(CHANGELOG_MAX_LENGTH).optional() },
    run: ({ policyId: target, changelog }, api) =>
      api.put(`/policies/${target}/status`, { status: 'in_review', ...defined({ changelog }) }),
  }),
  defineTool({
    name: 'approve_policy',
    title: 'Approve a policy',
    description:
      'Approves a policy that is in review, which saves a new numbered version. Only when the person tells you to approve this policy. The app’s rule applies: only the named approver may decide, or an admin when nobody is named (otherwise FORBIDDEN).',
    kind: 'change',
    input: { policyId },
    run: (args, api) => api.put(`/policies/${args.policyId}/status`, { status: 'approved' }),
  }),
  defineTool({
    name: 'send_policy_back',
    title: 'Send a policy back to draft',
    description:
      'Takes a policy that is in review back to draft so its text can change again. Same approver rule as approve_policy.',
    kind: 'change',
    input: { policyId },
    run: (args, api) => api.put(`/policies/${args.policyId}/status`, { status: 'draft' }),
  }),
  defineTool({
    name: 'reopen_policy',
    title: 'Reopen an approved policy',
    description:
      'Moves an approved policy back to draft so its text can change. Controls it covers stop counting as done until it is approved again. Only on the person’s say-so. Same approver rule as approve_policy.',
    kind: 'change',
    input: { policyId },
    run: (args, api) => api.put(`/policies/${args.policyId}/status`, { status: 'draft' }),
  }),
  defineTool({
    name: 'set_policy_approver',
    title: 'Name a policy’s approver',
    description:
      'Names the person who must approve a policy, from list_people, or null to go back to the plain approver title. Needs an admin key.',
    kind: 'change',
    input: { policyId, approverId: personId.nullable() },
    run: (args, api) =>
      api.put(`/policies/${args.policyId}/approver`, { approverId: args.approverId }),
  }),
  defineTool({
    name: 'get_policy_version',
    title: 'Get an approved version',
    description:
      'The text of one approved version of a policy, as Markdown. Version numbers are in get_policy under approvals.',
    kind: 'read',
    input: { policyId, version: z.number().int().min(1) },
    run: async (args, api) => {
      const { content, values } = await api.get<PolicyVersionResponse>(
        `/policies/${args.policyId}/versions/${args.version}`,
      );
      return { text: documentToMarkdown(content), values };
    },
  }),
  defineTool({
    name: 'archive_policy',
    title: 'Archive a policy',
    description:
      'Archives a policy so controls stop waiting on it. Only on the person’s say-so. restore_policy brings it back.',
    kind: 'remove',
    input: { policyId },
    run: (args, api) => api.post(`/policies/${args.policyId}/archive`),
  }),
  defineTool({
    name: 'restore_policy',
    title: 'Restore a policy',
    description: 'Brings an archived policy back.',
    kind: 'change',
    input: { policyId },
    run: (args, api) => api.post(`/policies/${args.policyId}/restore`),
  }),
];
