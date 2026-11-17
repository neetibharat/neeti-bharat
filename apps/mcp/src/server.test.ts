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
  it('offers no way to approve, and marks reads and removals so Claude is careful', async () => {
    const { client } = await connect({});
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((name) => /approve|decide|reopen|api_key/.test(name))).toEqual([]);
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

  it('asks for review only, and never sets another status', async () => {
    const { client, calls } = await connect({ 'PUT /policies/custom-1/status': { json: {} } });
    await client.callTool({ name: 'request_policy_review', arguments: { policyId: 'custom-1' } });
    expect(calls[0]?.body).toEqual({ status: 'in_review' });
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
    expect(textOf(result)).toContain('built-in');
    expect(textOf(result)).toContain('409 BUILT_IN');
    expect(textOf(result)).not.toContain('secret-key');
  });
});
