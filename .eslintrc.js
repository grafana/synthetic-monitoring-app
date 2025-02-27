module.exports = {
  extends: ['./.config/.eslintrc', 'plugin:@tanstack/eslint-plugin-query/recommended'],
  plugins: ['simple-import-sort'],
  ignorePatterns: ['**/snippets/*.js'],
  rules: {
    'no-redeclare': 'off', // we use typescript's 'no-redeclare' rule instead
    '@typescript-eslint/no-redeclare': ['error'],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportDefaultDeclaration',
        message: 'Prefer named exports',
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
};
