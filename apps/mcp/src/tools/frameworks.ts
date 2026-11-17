import {
  FRAMEWORK_ABOUT_MAX_LENGTH,
  FRAMEWORK_NAME_MAX_LENGTH,
  FRAMEWORK_SEAL_MAX_LENGTH,
  REQUIREMENT_REFERENCE_MAX_LENGTH,
  REQUIREMENT_SUMMARY_MAX_LENGTH,
  REQUIREMENT_TITLE_MAX_LENGTH,
  type ChecklistResponse,
  type FrameworkListResponse,
  type RulePageResponse,
  type SaveFrameworkRequest,
  type SaveRequirementRequest,
} from '@dpdp-kit/shared';
import { z } from 'zod';
import type { Api } from '../client.js';
import { defineTool } from '../tool.js';
import { defined, id } from './fields.js';

const frameworkId = id('The framework id from list_frameworks');
const ruleId = id('The rule id from get_framework');

const name = z.string().trim().min(1).max(FRAMEWORK_NAME_MAX_LENGTH);
const about = z
  .string()
  .trim()
  .max(FRAMEWORK_ABOUT_MAX_LENGTH)
  .describe('One sentence on what it is. May be empty.');
const seal = z
  .string()
  .trim()
  .min(1)
  .max(FRAMEWORK_SEAL_MAX_LENGTH)
  .describe('The short mark on its badge, such as ISO');
const reference = z
  .string()
  .trim()
  .min(1)
  .max(REQUIREMENT_REFERENCE_MAX_LENGTH)
  .describe('How it is numbered, such as 4.2');
const title = z.string().trim().min(1).max(REQUIREMENT_TITLE_MAX_LENGTH);
const summary = z
  .string()
  .trim()
  .max(REQUIREMENT_SUMMARY_MAX_LENGTH)
  .describe('What the rule asks of the company. May be empty.');

async function currentFramework(api: Api, id: string): Promise<SaveFrameworkRequest> {
  const { framework } = await api.get<ChecklistResponse>(`/frameworks/${id}`);
  return { name: framework.name, about: framework.about, seal: framework.seal };
}

async function currentRule(
  api: Api,
  framework: string,
  rule: string,
): Promise<SaveRequirementRequest> {
  const page = await api.get<RulePageResponse>(`/frameworks/${framework}/rules/${rule}`);
  const { reference, title, summary } = page.rule;
  return { reference, title, summary };
}

export const frameworkTools = [
  defineTool({
    name: 'list_frameworks',
    title: 'List frameworks',
    description:
      'Every framework (a set of rules a company follows) with its progress. DPDP is built in and cannot be changed; the company can add its own.',
    kind: 'read',
    input: {},
    run: (_args, api) => api.get<FrameworkListResponse>('/frameworks'),
  }),
  defineTool({
    name: 'get_framework',
    title: 'Get a framework',
    description:
      'One framework: every rule with its controls (id, title, status, policy ids), and archived controls. Use it to find rule and control ids.',
    kind: 'read',
    input: { frameworkId },
    run: async (args, api) => {
      const checklist = await api.get<ChecklistResponse>(`/frameworks/${args.frameworkId}`);
      return {
        framework: checklist.framework,
        rules: checklist.rules.map((rule) => ({
          id: rule.id,
          reference: rule.reference,
          title: rule.title,
          isCustom: rule.isCustom,
          applies: rule.applies,
          controls: rule.controls.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            policyIds: c.policies.map((policy) => policy.id),
          })),
        })),
        archivedControls: checklist.archived,
      };
    },
  }),
  defineTool({
    name: 'get_rule',
    title: 'Get a rule',
    description:
      'One rule with every control in full (description, owner job, assignee, review date, policies, proof counts) and the policies that cover it. Read this before changing a control.',
    kind: 'read',
    input: { frameworkId, ruleId },
    run: (args, api) =>
      api.get<RulePageResponse>(`/frameworks/${args.frameworkId}/rules/${args.ruleId}`),
  }),
  defineTool({
    name: 'create_framework',
    title: 'Add a framework',
    description:
      'Adds a framework of the company’s own. Replies with its id. Check list_frameworks first so you do not add a duplicate.',
    kind: 'change',
    input: { name, about, seal },
    run: (args, api) => api.post('/frameworks', args),
  }),
  defineTool({
    name: 'update_framework',
    title: 'Change a framework',
    description:
      'Changes a framework the company made. Send only what changes. A built-in framework cannot change (BUILT_IN).',
    kind: 'change',
    input: { frameworkId, name: name.optional(), about: about.optional(), seal: seal.optional() },
    run: async ({ frameworkId: target, ...changes }, api) =>
      api.put(`/frameworks/${target}`, {
        ...(await currentFramework(api, target)),
        ...defined(changes),
      }),
  }),
  defineTool({
    name: 'archive_framework',
    title: 'Archive a framework',
    description:
      'Archives a framework the company made. Only on the person’s say-so. Its controls must be archived first (HAS_CONTROLS). There is no restore.',
    kind: 'remove',
    input: { frameworkId },
    run: (args, api) => api.post(`/frameworks/${args.frameworkId}/archive`),
  }),
  defineTool({
    name: 'create_rule',
    title: 'Add a rule',
    description: 'Adds a rule to a framework the company made. Replies with its id.',
    kind: 'change',
    input: { frameworkId, reference, title, summary },
    run: ({ frameworkId: target, ...rule }, api) =>
      api.post(`/frameworks/${target}/requirements`, rule),
  }),
  defineTool({
    name: 'update_rule',
    title: 'Change a rule',
    description: 'Changes a rule of a framework the company made. Send only what changes.',
    kind: 'change',
    input: {
      frameworkId,
      ruleId,
      reference: reference.optional(),
      title: title.optional(),
      summary: summary.optional(),
    },
    run: async ({ frameworkId: framework, ruleId: rule, ...changes }, api) =>
      api.put(`/requirements/${rule}`, {
        ...(await currentRule(api, framework, rule)),
        ...defined(changes),
      }),
  }),
  defineTool({
    name: 'archive_rule',
    title: 'Archive a rule',
    description:
      'Archives a rule of a framework the company made. Only on the person’s say-so. Its controls must be archived first (HAS_CONTROLS). There is no restore.',
    kind: 'remove',
    input: { ruleId },
    run: (args, api) => api.post(`/requirements/${args.ruleId}/archive`),
  }),
];
