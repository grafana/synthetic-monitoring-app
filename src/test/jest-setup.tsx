/* eslint-disable simple-import-sort/imports */
// Jest setup provided by Grafana scaffolding
import '../../.config/jest-setup';
import React from 'react';
import { BackendSrvRequest } from '@grafana/runtime';
import { OrgRole } from '@grafana/data';
import { server } from './server';
import axios, { Method } from 'axios';
import { from } from 'rxjs';

import { instanceSettings } from '../../src/datasource/__mocks__/DataSource';
import { SMDataSource } from '../../src/datasource/DataSource';

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
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

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  return {
    ...actual,
    config: {
      ...actual.config,
      bootData: {
        ...actual.config.bootData,
        user: {
          ...actual.config.bootData.user,
          orgRole: OrgRole.Editor,
        },
      },
      featureToggles: {
        ...actual.config.featureToggles,
        topnav: true,
      },
    },
    getBackendSrv: () => ({
      datasourceRequest: axios.request,
      fetch: (request: BackendSrvRequest) => {
        return from(
          axios
            .request({
              ...request,
              method: request.method as Method,
            })
            .catch((e) => {
              const error = new Error(e.message);
              // @ts-expect-error Match error format with backendsrv
              error.data = e.response.data;
              // @ts-expect-error Match error format with backendsrv
              error.status = e.response.status;

              throw error;
            })
        );
      },
      get: axios.get,
    }),
    getDataSourceSrv: () => ({
      get: () => {
        return Promise.resolve(new SMDataSource(instanceSettings));
      },
    }),
    getLocationSrv: () => ({
      update: (args: any) => args,
    }),
    PluginPage: ({ actions, children, pageNav }: any) => {
      return (
        <div>
          <h2>{pageNav?.text}</h2>
          <div>{actions}</div>
          {children}
        </div>
      );
    },
  };
});
