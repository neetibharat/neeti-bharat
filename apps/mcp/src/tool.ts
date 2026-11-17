import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, type ZodRawShape } from 'zod';
import type { Api } from './client.js';
import { describeFailure } from './errors.js';

/**
 * What a tool does to the company's data. It tells Claude how careful to be: a read changes nothing, a change
 * can be undone by changing it again, and a removal is the one to confirm first.
 */
export type ToolKind = 'read' | 'change' | 'remove';

export interface Tool<S extends ZodRawShape> {
  name: string;
  title: string;
  /** Written for Claude: what it does, and what to know before using it. */
  description: string;
  kind: ToolKind;
  input: S;
  run: (args: z.infer<z.ZodObject<S>>, api: Api) => Promise<unknown>;
}

export type Registration = (server: McpServer, api: Api) => void;

export const defineTool =
  <S extends ZodRawShape>(tool: Tool<S>): Registration =>
  (server, api) => {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input as ZodRawShape,
        annotations: {
          readOnlyHint: tool.kind === 'read',
          destructiveHint: tool.kind === 'remove',
          openWorldHint: false,
        },
      },
      async (args) => {
        try {
          const result = await tool.run(args as z.infer<z.ZodObject<S>>, api);
          return { content: [{ type: 'text' as const, text: render(result) }] };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: describeFailure(error) }],
          };
        }
      },
    );
  };

const render = (result: unknown): string =>
  result === undefined ? 'Done.' : JSON.stringify(result, null, 2);
