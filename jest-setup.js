/* eslint-disable simple-import-sort/imports */
// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';

afterEach(() => {
  config.bootData.user.orgRole = OrgRole.Editor;
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
