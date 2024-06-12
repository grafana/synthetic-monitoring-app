/* eslint-disable simple-import-sort/imports */
// Jest setup provided by Grafana scaffolding
import '../../.config/jest-setup';
import { server } from './server';
import 'test/silenceErrors';
import './encoder-workaround';

// have to reimport this despite it is included in the ./config/jest-setup.JSfile
// so the types also get imported
import '@testing-library/jest-dom';

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

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
