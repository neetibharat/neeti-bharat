import {
  CONTROL_DESCRIPTION_MAX_LENGTH,
  CONTROL_TITLE_MAX_LENGTH,
  type ControlResponse,
  type RulePageResponse,
  type SaveControlRequest,
} from '@neeti-bharat/shared';
import { z } from 'zod';
import type { Api } from '../client.js';
import { defineTool } from '../tool.js';
import { dateText, defined, id, jobRole, personId } from './fields.js';

const controlId = id('The control id from get_rule');
const frameworkId = id('The framework the control is in');
const ruleId = id('The rule the control sits under');

const title = z.string().trim().min(1).max(CONTROL_TITLE_MAX_LENGTH);
const description = z
  .string()
  .trim()
  .min(1)
  .max(CONTROL_DESCRIPTION_MAX_LENGTH)
  .describe('What the control asks the company to do');
const assigneeId = personId
  .nullable()
  .describe('A person’s id from list_people, or null for nobody');
const reviewDate = dateText.nullable().describe('YYYY-MM-DD, or null for no review date');
const policyIds = z
  .array(id('A policy id from list_policies'))
  .describe('Policies that cover it, main one first. Replaces the current list. May be empty.');

function detailsOf(control: ControlResponse): SaveControlRequest {
  return {
    title: control.title,
    description: control.description,
    ownerRole: control.ownerRole,
    assigneeId: control.assignee?.id ?? null,
    reviewDate: control.reviewDate,
    policyIds: control.policies.map((policy) => policy.id),
  };
}

async function currentControl(api: Api, framework: string, rule: string, control: string) {
  const page = await api.get<RulePageResponse>(`/frameworks/${framework}/rules/${rule}`);
  const found = page.rule.controls.find((candidate) => candidate.id === control);
  if (!found)
    throw new Error(`No active control ${control} under rule ${rule}. Read the rule again.`);
  return detailsOf(found);
}

const where = { frameworkId, ruleId, controlId };

export const controlTools = [
  defineTool({
    name: 'create_control',
    title: 'Add a control',
    description:
      'Adds a control (something the company does to meet a rule) under a rule, or under ORG for organisation-wide ones. It starts as not started: its status comes from approved policies and proof. Replies with the control.',
    kind: 'change',
    input: {
      requirementId: id('A rule id from get_framework, or ORG'),
      title,
      description,
      assigneeId: assigneeId.default(null),
      reviewDate: reviewDate.default(null),
      policyIds: policyIds.default([]),
    },
    run: (args, api) => api.post('/controls', args),
  }),
  defineTool({
    name: 'update_control',
    title: 'Change a control',
    description:
      'Changes a control. Send only what changes: the rest is kept. policyIds, when sent, replaces the whole list. Needs the framework and rule the control is under.',
    kind: 'change',
    input: {
      ...where,
      title: title.optional(),
      description: description.optional(),
      ownerRole: jobRole.optional(),
      assigneeId: assigneeId.optional(),
      reviewDate: reviewDate.optional(),
      policyIds: policyIds.optional(),
    },
    run: async ({ frameworkId: framework, ruleId: rule, controlId: control, ...changes }, api) =>
      api.put(`/controls/${control}/details`, {
        ...(await currentControl(api, framework, rule, control)),
        ...defined(changes),
      }),
  }),
  defineTool({
    name: 'add_policies_to_control',
    title: 'Link policies to a control',
    description:
      'Adds policies to the ones already covering a control, keeping the rest. Use it to say “this policy covers this control”.',
    kind: 'change',
    input: { ...where, policyIds: z.array(id('A policy id')).min(1) },
    run: async (
      { frameworkId: framework, ruleId: rule, controlId: control, policyIds: added },
      api,
    ) => {
      const current = await currentControl(api, framework, rule, control);
      const merged = [...new Set([...current.policyIds, ...added])];
      return api.put(`/controls/${control}/details`, { ...current, policyIds: merged });
    },
  }),
  defineTool({
    name: 'archive_control',
    title: 'Archive a control',
    description:
      'Takes a control out of the counts. Only on the person’s say-so. Its proof is kept, and restore_control brings it back.',
    kind: 'remove',
    input: { controlId },
    run: (args, api) => api.post(`/controls/${args.controlId}/archive`),
  }),
  defineTool({
    name: 'restore_control',
    title: 'Restore a control',
    description: 'Brings an archived control back.',
    kind: 'change',
    input: { controlId },
    run: (args, api) => api.post(`/controls/${args.controlId}/restore`),
  }),
];
