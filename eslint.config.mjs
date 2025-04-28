import simpleImportSort from 'eslint-plugin-simple-import-sort';
import queryPlugin from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import tsParser from '@typescript-eslint/parser';
import customPlugin from './eslintCustom/plugin.custom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = defineConfig([
  globalIgnores(['**/snippets/*.js', '.config/**', 'dist']),
  ...compat.extends('./.config/.eslintrc'),
  ...compat.extends('plugin:@tanstack/eslint-plugin-query/recommended'),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@tanstack/eslint-plugin-query': queryPlugin,
      'custom-plugin': customPlugin,
    },
    rules: {
      'no-console': ['error', { allow: ['log'] }],
      'custom-plugin/tracking-event-creation': 'error',
      'no-console': ['error', { allow: ['log'] }],
      'no-redeclare': 'off', // we use typescript's 'no-redeclare' rule instead
      '@typescript-eslint/no-redeclare': ['error'],
      '@typescript-eslint/no-deprecated': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Prefer named exports',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@grafana/runtime',
              importNames: ['reportInteraction'],
              message: 'Please use createSMEventFactory to create an event factory',
            },
          ],
        },
      ],
      ['simple-import-sort/imports']: [
        'error',
        {
          groups: [
            // Node.js builtins.
            // then `react` packages, grafana packages, scoped packages, non-scoped packages
            // -- because of the absolute paths we use in the src folder, they might get caught in this check so have to be added explicitly to internal packages
            // then test folder utils
            [
              '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
              '^react',
              '^@tanstack',
              '^@grafana',
              '^grafana',
              '^@?\\w',
              '^test',
              '^__mocks__',
              '^datasource/__mocks__',
            ],
            // Internal packages.
            [
              'types',
              '^faro',
              '^sessionStorage',
              '^utils',
              '^routing',
              '^validation',
              '^datasource',
              '^contexts',
              '^data',
              '^hooks',
              '^components',
              '^page',
              '^scenes',
            ],
            // Parent imports.
            // then other relative imports. Put same-folder imports and `.` last.
            // then image imports
            // then style imports
            // then side effect imports
            [
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
              '^img',
              '^.styles$',
              '^\\u0000',
            ],
          ],
        },
      ],
    },
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
]);

export default config;
