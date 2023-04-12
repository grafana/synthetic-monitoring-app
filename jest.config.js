// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');
const config = require('./.config/jest.config');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...config,
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect', ...(config.setupFilesAfterEnv || [])],
  moduleNameMapper: {
    ...config.moduleNameMapper,
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$':
      '<rootDir>/src/test/fileMock.js',
  },
  // testTimeout: 30000,
  // Inform jest to only transform specific node_module packages.
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'yaml'])],
};
