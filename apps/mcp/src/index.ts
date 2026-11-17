#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Api } from './client.js';
import { readConfig } from './config.js';
import { createServer } from './server.js';

try {
  const server = createServer(new Api(readConfig(process.env)));
  await server.connect(new StdioServerTransport());
} catch (error) {
  // stdout carries the protocol, so a failure to start goes to stderr, where the host shows it.
  const reason = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${reason}\n`);
  process.exit(1);
}
