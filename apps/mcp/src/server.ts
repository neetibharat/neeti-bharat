import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Api } from './client.js';
import { INSTRUCTIONS } from './instructions.js';
import type { Registration } from './tool.js';
import { contextTools } from './tools/context.js';
import { controlTools } from './tools/controls.js';
import { evidenceTools } from './tools/evidence.js';
import { frameworkTools } from './tools/frameworks.js';
import { policyTools } from './tools/policies.js';
import { proofTools } from './tools/proof.js';

/** Every tool, in the order Claude is shown them. There is no tool to approve a policy: a person does that in the app. */
export const TOOLS: Registration[] = [
  ...contextTools,
  ...frameworkTools,
  ...controlTools,
  ...policyTools,
  ...proofTools,
  ...evidenceTools,
];

export function createServer(api: Api): McpServer {
  const server = new McpServer(
    { name: 'dpdp-kit', version: '0.1.0' },
    { instructions: INSTRUCTIONS },
  );
  for (const register of TOOLS) register(server, api);
  return server;
}
