// Bundles the server and everything it needs into one file, so it runs with plain Node and nothing to install.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'bundle/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  minify: false,
  // Packages written for CommonJS expect require, which a bundled ES module does not have.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});
