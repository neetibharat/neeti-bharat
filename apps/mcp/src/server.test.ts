import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { Api } from './client.js';
import { createServer } from './server.js';

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

type Reply = { status?: number; json?: unknown };

/** A fake fetch that answers by route and records every call. */
function fakeApi(routes: Record<string, Reply>, calls: Call[]): typeof fetch {
  return (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const route = `${init?.method} ${url.pathname.replace('/v1', '')}`;
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({
      method: String(init?.method),
      url: url.toString(),
      headers: init?.headers as Record<string, string>,
      body,
    });
    return reply(routes[route]);
  }) as typeof fetch;
}

function reply(route: Reply = { status: 404, json: { statusCode: 404, code: 'NOT_FOUND' } }) {
  const status = route.status ?? 200;
  return new Response(status === 204 ? null : JSON.stringify(route.json ?? {}), { status });
}

/** A connected client, with a fake API behind it. */
async function connect(routes: Record<string, Reply>) {
  const calls: Call[] = [];
  const send = fakeApi(routes, calls);

  const api = new Api({ apiUrl: 'https://api.test', apiKey: 'secret-key' }, send);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(api).connect(serverSide);
  const client = new Client({ name: 'test', version: '1' });
  await client.connect(clientSide);
  return { client, calls };
}

const textOf = (result: unknown): string =>
  ((result as { content: { text: string }[] }).content[0] as { text: string }).text;

const RULE_PAGE = {
  rule: {
    id: 'R6',
    controls: [
      {
        id: 'c1',
        title: 'Vendor contracts',
        description: 'Checked each year.',
        ownerRole: 'LEGAL_COUNSEL',
        assignee: { id: 'p1', name: 'Asha' },
        reviewDate: '2027-01-31',
        policies: [{ id: 'P08', title: 'Breach' }],
      },
    ],
  },
  policies: [],
};

describe('the tools Claude is given', () => {
  it('offers nothing for API keys, and marks reads and removals so Claude is careful', async () => {
    const { client } = await connect({});
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((name) => /api_key|ai_setting|sign_in|secret/.test(name))).toEqual([]);
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool.annotations]));
    expect(byName['list_policies']?.readOnlyHint).toBe(true);
    expect(byName['archive_policy']?.destructiveHint).toBe(true);
    expect(byName['create_policy']?.readOnlyHint).toBe(false);
  });

  it('sends the key in a header on every call', async () => {
    const { client, calls } = await connect({ 'GET /frameworks': { json: { frameworks: [] } } });
    await client.callTool({ name: 'list_frameworks', arguments: {} });
    expect(calls[0]?.headers['x-api-key']).toBe('secret-key');
    expect(calls[0]?.url).toBe('https://api.test/v1/frameworks');
  });

  it('changes a control by merging what was sent into what is stored', async () => {
    const { client, calls } = await connect({
      'GET /frameworks/dpdp/rules/R6': { json: RULE_PAGE },
      'PUT /controls/c1/details': { json: { id: 'c1' } },
    });
    await client.callTool({
      name: 'update_control',
      arguments: { frameworkId: 'dpdp', ruleId: 'R6', controlId: 'c1', reviewDate: null },
    });
    expect(calls[1]?.body).toEqual({
      title: 'Vendor contracts',
      description: 'Checked each year.',
      ownerRole: 'LEGAL_COUNSEL',
      assigneeId: 'p1',
      reviewDate: null,
      policyIds: ['P08'],
    });
  });

  it('links a policy without dropping the ones already linked', async () => {
    const { client, calls } = await connect({
      'GET /frameworks/dpdp/rules/R6': { json: RULE_PAGE },
      'PUT /controls/c1/details': { json: {} },
    });
    await client.callTool({
      name: 'add_policies_to_control',
      arguments: {
        frameworkId: 'dpdp',
        ruleId: 'R6',
        controlId: 'c1',
        policyIds: ['custom-9', 'P08'],
      },
    });
    expect((calls[1]?.body as { policyIds: string[] }).policyIds).toEqual(['P08', 'custom-9']);
  });

  it('writes policy text as the editor’s document, not as raw Markdown', async () => {
    const { client, calls } = await connect({ 'PUT /policies/custom-1/content': { json: {} } });
    await client.callTool({
      name: 'write_policy_text',
      arguments: { policyId: 'custom-1', markdown: '## Purpose\n\nShare with **care**.' },
    });
    const sent = calls[0]?.body as { content: { type: string; content: { type: string }[] } };
    expect(sent.content.type).toBe('doc');
    expect(JSON.stringify(sent)).not.toContain('##');
    expect(JSON.stringify(sent)).not.toContain('**');
  });

  it('moves a policy through review, approval, back to draft and reopening', async () => {
    const { client, calls } = await connect({ 'PUT /policies/custom-1/status': { json: {} } });
    for (const name of [
      'request_policy_review',
      'approve_policy',
      'send_policy_back',
      'reopen_policy',
    ]) {
      await client.callTool({ name, arguments: { policyId: 'custom-1' } });
    }
    expect(calls.map((call) => call.body)).toEqual([
      { status: 'in_review' },
      { status: 'approved' },
      { status: 'draft' },
      { status: 'draft' },
    ]);
  });

  it('names an approver, or goes back to the title', async () => {
    const { client, calls } = await connect({ 'PUT /policies/P08/approver': { json: {} } });
    await client.callTool({
      name: 'set_policy_approver',
      arguments: { policyId: 'P08', approverId: 'p1' },
    });
    await client.callTool({
      name: 'set_policy_approver',
      arguments: { policyId: 'P08', approverId: null },
    });
    expect(calls.map((call) => call.body)).toEqual([{ approverId: 'p1' }, { approverId: null }]);
  });

  it('adds, changes and removes the company answers that policies quote', async () => {
    const { client, calls } = await connect({
      'POST /profile/entries': { json: { key: 'custom_office' } },
      'PUT /profile/entries/breachWindow': { json: {} },
      'DELETE /profile/entries/custom_office': { status: 204 },
    });
    await client.callTool({
      name: 'add_company_answer',
      arguments: { label: 'Office', value: 'MG Road' },
    });
    await client.callTool({
      name: 'update_company_answer',
      arguments: { key: 'breachWindow', value: '72 hours', confirmed: true },
    });
    await client.callTool({ name: 'remove_company_answer', arguments: { key: 'custom_office' } });
    expect(calls.map((call) => `${call.method} ${new URL(call.url).pathname}`)).toEqual([
      'POST /v1/profile/entries',
      'PUT /v1/profile/entries/breachWindow',
      'DELETE /v1/profile/entries/custom_office',
    ]);
    expect(calls[1]?.body).toEqual({ value: '72 hours', confirmed: true });
  });

  it('can change and archive a rule of the built-in framework', async () => {
    const { client, calls } = await connect({
      'GET /frameworks/dpdp/rules/R6': {
        json: { rule: { reference: 'Rule 6', title: 'T', summary: 'S' } },
      },
      'PUT /requirements/R6': { status: 204 },
      'POST /requirements/R6/archive': { status: 204 },
    });
    await client.callTool({
      name: 'update_rule',
      arguments: { frameworkId: 'dpdp', ruleId: 'R6', title: 'New' },
    });
    await client.callTool({ name: 'archive_rule', arguments: { ruleId: 'R6' } });
    expect(calls[1]?.body).toEqual({ reference: 'Rule 6', title: 'New', summary: 'S' });
    expect(calls[2]?.method).toBe('POST');
  });

  it('refuses an id that could change the path of the request', async () => {
    const { client, calls } = await connect({});
    const result = await client.callTool({
      name: 'archive_policy',
      arguments: { policyId: '../api-keys' },
    });
    expect(result.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it('explains a failure in plain words without echoing the key', async () => {
    const { client } = await connect({
      'POST /policies/P01/archive': { status: 409, json: { statusCode: 409, code: 'BUILT_IN' } },
    });
    const result = await client.callTool({
      name: 'archive_policy',
      arguments: { policyId: 'P01' },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('locked');
    expect(textOf(result)).toContain('409 BUILT_IN');
    expect(textOf(result)).not.toContain('secret-key');
  });
});
