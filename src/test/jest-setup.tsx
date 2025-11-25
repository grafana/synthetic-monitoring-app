/* eslint-disable simple-import-sort/imports */
// Jest setup provided by Grafana scaffolding
import '../../.config/jest-setup';
import './setup-msw-polyfill';

import { server } from './server';
import 'test/silenceErrors';
import 'jest-canvas-mock';

// have to reimport this despite it is included in the ./config/jest-setup.JSfile
// so the types also get imported
import '@testing-library/jest-dom';
import { queryClient } from 'data/queryClient';

process.env.SM_PLUGIN_ID = 'TEST.ENV.ID';
process.env.SM_PLUGIN_VERSION = 'TEST.ENV.VERSION';

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // Clear React Query cache to prevent memory leaks
  queryClient.clear();
  // Ensure fake timers are restored if they were used
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});

afterAll(() => {
  server.close();
  // Clean up any remaining timers
  jest.clearAllTimers();
});

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

import 'test/mocks/@grafana/runtime';
import 'test/mocks/@grafana/ui';
import 'test/mocks/components/SimpleMap';

// note there are some other mocks set up in jest.config.js
// for example the rawLoader, unsupported_file, grafana/app/core/core
// and grafana/app/core/app_events
