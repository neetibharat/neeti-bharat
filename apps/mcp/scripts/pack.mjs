// Puts the bundle and the manifest in one folder and packs it into a file Claude Desktop installs with a double-click.
// MCP_VERSION, when set, is written into the manifest so each release carries its own version.
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('extension', { recursive: true, force: true });
mkdirSync('extension', { recursive: true });
cpSync('bundle/server.mjs', 'extension/server.mjs');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
if (process.env.MCP_VERSION) manifest.version = process.env.MCP_VERSION;
writeFileSync('extension/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

execSync('pnpm exec mcpb pack extension neeti-bharat.mcpb', { stdio: 'inherit' });
