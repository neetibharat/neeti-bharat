import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'apps/api/src/generated/**',
      'apps/mcp/bundle/**',
      'apps/mcp/extension/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
      'prefer-const': 'error',
      // Keep functions small and flat.
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 5],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // One Prisma client for the whole API, queried only from repositories.
    files: ['apps/api/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='PrismaClient']",
          message: 'Inject PrismaService. The app has exactly one Prisma client.',
        },
      ],
    },
  },
  {
    // Promises that nobody awaits fail silently; these rules need type information.
    files: ['apps/api/**/*.{ts,mts}'],
    ignores: ['apps/api/src/generated/**'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  {
    // Controllers, services and utils never query: no PrismaService, and from the generated client only types.
    files: ['apps/api/src/**/{controllers,services,utils}/**/*.ts'],
    ignores: ['apps/api/src/core/prisma/**', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: 'prisma\\.service',
              message: 'Query the database from a repository, not a controller, service or util.',
            },
            {
              regex: 'generated/prisma',
              allowTypeImports: true,
              message:
                'Import only types from the generated client; runtime values belong in repositories.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    settings: { next: { rootDir: 'apps/web' } },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.test.ts', '**/*.config.{ts,mts,mjs}'],
    rules: { 'max-lines-per-function': 'off' },
  },
);
