// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');
const config = require('./.config/jest.config');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...config,
  setupFilesAfterEnv: ['<rootDir>/src/test/jest-setup.tsx'],
  moduleNameMapper: {
    ...config.moduleNameMapper,
    '^lodash-es$': 'lodash',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$':
      '<rootDir>/src/test/mocks/unsupported_file.js',
    '^!raw-loader!*': '<rootDir>/src/test/mocks/rawLoader.js',
    '^(.+)\\?raw$': '<rootDir>/src/test/mocks/rawLoader.js',
    '^grafana/app/core/core$': '<rootDir>/src/test/mocks/grafana/app/core/core.js',
    '^grafana/app/core/app_events$': '<rootDir>/src/test/mocks/grafana/app/core/app_events.js',
  },
  testTimeout: 30000,
  // Inform jest to only transform specific node_module packages.
  transform: {
    ...config.transform,
    '^.+\\.mjs$': ['@swc/jest'],
    'assets/snippets/.+\\.js$': '<rootDir>/src/test/mocks/rawLoader.js',
  },
  transformIgnorePatterns: [
    nodeModulesToTransform([
      ...grafanaESModules,
      'flat',
      '@grafana/ui/node_modules/ol',
      'yaml',
      '@grafana/schema',
      'har-to-k6',
      'nanoid',
      'prettier/esm',
      'constrained-editor-plugin',
    ]),
  ],
};
